import { EventEmitter } from 'node:events';
import type { Builder, BuildOutcome } from '../builders/types.js';
import { displayPath, type ResolvedStarsConfig, type StarsHooks, type StarsRestartReason } from '@wolfstar/schema';
import { describeCommand, diffSnapshots, type CommandChange } from '../utils/command-diff.js';
import { envImportArgs, moduleImportArgs } from '../utils/env-import.js';
import type { StarsHookable } from '../utils/hooks.js';
import { classifyAppLine, LogBuffer, type LogLevel, type LogSource } from '../utils/log-buffer.js';
import { Locales } from '../utils/locales.js';
import { ProcessSupervisor, type ProcessExit, type ProcessState } from '../utils/process-supervisor.js';
import { bridgeImportArgs, CLI_SOURCE, parseBridgeMessage, type BridgeMessage, type CommandSnapshot, type RefreshRequest } from './bridge.js';
import { changedFiles, couldBePiece, isInside, snapshotFiles, type FileSnapshot, type HashCache } from './changed-files.js';
import { Tunnel, type TunnelState } from './tunnel.js';
import { Typechecker, type TypecheckState } from './typechecker.js';

export type BuildState = 'idle' | 'building' | 'ok' | 'failed';
export type HealthState = 'unknown' | 'ok' | 'down';
export type RestartReason = StarsRestartReason;

/** A question the dev UI asks the user; {@link DevService.answerPrompt} settles it. */
export interface DevPrompt {
	readonly kind: 'commands';
	readonly changes: readonly CommandChange[];
}

export interface LogExtra {
	/** The channel to log on instead of the source's own. */
	channel?: string;
	detail?: readonly string[];
}

export interface DevStatus {
	readonly progress: { readonly fraction: number; readonly message: string; readonly startedAt: number; readonly readyMs: number | null };
	readonly process: ProcessState;
	readonly build: BuildState;
	readonly health: HealthState;
	readonly pid: number | null;
	readonly startedAt: number | null;
	readonly restarts: number;
	readonly lastRestartReason: RestartReason | null;
	readonly lastBuild: BuildOutcome | null;
	readonly lastExit: ProcessExit | null;
	readonly url: string | null;
	readonly typecheck: TypecheckState;
	readonly typeErrors: number;
	readonly tunnel: TunnelState;
	readonly tunnelUrl: string | null;
	/** Whether the running bot reported that it is listening (see the bridge); always `false` without the bridge. */
	readonly ready: boolean;
	/** The port the bot reported it listens on. */
	readonly port: number | null;
	/** Whether the running bot reported that it hot reloads its pieces. */
	readonly hmr: boolean;
	/** Whether the bot was stopped on purpose (the `d` key) and waits for a restart. */
	readonly paused: boolean;
	readonly prompt: DevPrompt | null;
}

export interface DevServiceEvents {
	status: [status: DevStatus];
}

export interface DevServiceOptions {
	builder: Builder;
	/** The `stars.config` hooks; `build:*` and `dev:restart` run from here. */
	hooks?: StarsHookable;
	logs?: LogBuffer;
	/** Overrides for tests. */
	supervisor?: ProcessSupervisor;
	typechecker?: Typechecker;
	tunnel?: Tunnel;
	healthInterval?: number;
	/**
	 * Whether the tunnel opens at start: `true` opens it whatever `dev.tunnel` says (a quick tunnel when it is off),
	 * `false` keeps it closed, and `undefined` leaves it to `dev.tunnel`. The `--tunnel`/`--no-tunnel` flags.
	 */
	openTunnel?: boolean;
}

/**
 * The headless heart of `stars dev`: builds, (re)starts the bot and exposes state and logs.
 * Renderers (plain or TUI) only subscribe to it, they never own behaviour.
 */
export class DevService extends EventEmitter<DevServiceEvents> {
	public readonly logs: LogBuffer;
	public readonly builder: Builder;
	public readonly supervisor: ProcessSupervisor;
	public readonly typechecker: Typechecker;
	public readonly tunnel: Tunnel;
	public readonly locales: Locales;
	/** Whether something can answer a {@link DevPrompt}: the interactive UI sets it, the plain renderer cannot. */
	public promptable = false;
	readonly #hooks: StarsHookable | null;
	readonly #openTunnel: boolean | undefined;
	/** Runs hooks one at a time, so an async `build:done` settles before the next build's hooks or a restart. */
	#hookChain: Promise<void> = Promise.resolve();

	#build: BuildState = 'idle';
	#health: HealthState = 'unknown';
	#restarts = 0;
	#lastRestartReason: RestartReason | null = null;
	#lastBuild: BuildOutcome | null = null;
	#lastExit: ProcessExit | null = null;
	#restartTimer: NodeJS.Timeout | null = null;
	#healthTimer: NodeJS.Timeout | null = null;
	/** The restart a build asked for that has not happened yet: it outlives the timer, which the next build start clears. */
	#pendingReason: RestartReason | null = null;
	#stopped = false;
	#queue: Promise<void> = Promise.resolve();
	#progress = { fraction: 0, message: 'preparing your app', startedAt: Date.now(), readyMs: null as number | null };
	#ready = false;
	#port: number | null = null;
	/** The store paths the running bot watches for hot reloads, empty when it does not. */
	#hmrPaths: string[] = [];
	#paused = false;
	#prompt: DevPrompt | null = null;
	/** The commands the bot last reported, kept across restarts: a restart is how most changes arrive. */
	#commands: CommandSnapshot | null = null;
	/** What the build output held after the previous build, `null` before the first one. */
	#files: FileSnapshot | null = null;
	readonly #hashes: HashCache = new Map();
	/** The files the running bot loaded pieces from: what its hot reload can replace. */
	#pieces = new Set<string>();
	/** The commands Discord is assumed to have: the first report of the session, then whatever was last deployed. */
	#deployed: CommandSnapshot | null = null;
	/** A refresh of the commands asked for while the bot was not listening; sent once it is. */
	#refreshPending = false;
	/** Restarts waiting for the running build to end, see {@link DevService.#buildSettled}. */
	#buildWaiters: Array<() => void> = [];

	public constructor(
		public readonly config: ResolvedStarsConfig,
		options: DevServiceOptions
	) {
		super();
		this.logs = options.logs ?? new LogBuffer();
		this.builder = options.builder;
		this.supervisor = options.supervisor ?? createSupervisor(config);
		this.typechecker = options.typechecker ?? new Typechecker(config);
		this.tunnel = options.tunnel ?? new Tunnel(config);
		this.locales = new Locales(config);
		this.#hooks = options.hooks ?? null;
		this.#openTunnel = options.openTunnel;

		this.builder.on('start', () => {
			this.#progress = { fraction: 0, message: 'preparing build', startedAt: Date.now(), readyMs: null };
			// A restart armed by the previous build must not fire while this one rewrites the output; it stays owed.
			this.#clearRestartTimer();
			this.#setBuild('building');
			void this.#startHook('build:before', this.config);
		});
		this.builder.on('progress', (fraction, message) => {
			this.#progress = { ...this.#progress, fraction: Math.max(this.#progress.fraction, Math.min(0.75, fraction)), message };
			this.#emitStatus();
		});
		this.builder.on('success', (outcome) => this.#onBuildSuccess(outcome));
		this.builder.on('failure', (outcome) => this.#onBuildFailure(outcome));
		this.builder.on('log', (level, text) => this.log('build', level, text));

		this.supervisor.on('state', () => {
			if (this.supervisor.state === 'running') {
				this.#settleProgress();
				void this.#checkHealth();
			}
			this.#emitStatus();
		});
		this.supervisor.on('stdout', (line) => this.log('app', classifyAppLine(line, 'info'), line));
		this.supervisor.on('stderr', (line) => this.log('app', classifyAppLine(line, 'error'), line));
		this.supervisor.on('message', (message) => {
			const parsed = parseBridgeMessage(message);
			if (parsed === null) return;
			try {
				this.#onBridge(parsed);
			} catch (error) {
				// Whatever the bot sends, it must not take the session down.
				this.log('stars', 'warn', `Ignored a ${parsed.type} message from the bot: ${error instanceof Error ? error.message : String(error)}`);
			}
		});
		this.supervisor.on('error', (error) => this.log('stars', 'error', `Failed to start the bot: ${error.message}`));
		this.supervisor.on('exit', (exit) => this.#onExit(exit));

		this.typechecker.on('log', (level, text) => this.log('tsc', level, text));
		this.typechecker.on('state', () => this.#emitStatus());
		this.tunnel.on('log', (level, text) => this.log('tunnel', level, text));
		this.tunnel.on('state', () => this.#emitStatus());
		this.locales.on('log', (level, text) => this.log('build', level, text));
		this.locales.on('change', () => {
			if (this.#build === 'ok') this.#scheduleRestart('build');
		});

		if (config.dev.url && config.dev.health) {
			const interval = options.healthInterval ?? 5000;
			this.#healthTimer = setInterval(() => void this.#checkHealth(), interval);
			this.#healthTimer.unref();
		}
	}

	public get status(): DevStatus {
		return {
			progress: this.#progress,
			process: this.supervisor.state,
			build: this.#build,
			health: this.#health,
			pid: this.supervisor.pid,
			startedAt: this.supervisor.startedAt,
			restarts: this.#restarts,
			lastRestartReason: this.#lastRestartReason,
			lastBuild: this.#lastBuild,
			lastExit: this.#lastExit,
			url: this.config.dev.url,
			typecheck: this.typechecker.state,
			typeErrors: this.typechecker.errors,
			tunnel: this.tunnel.state,
			tunnelUrl: this.tunnel.url,
			ready: this.#ready,
			port: this.#port,
			hmr: this.#hmrPaths.length > 0,
			paused: this.#paused,
			prompt: this.#prompt
		};
	}

	public log(source: LogSource, level: LogLevel, text: string, extra: LogExtra = {}): void {
		this.logs.push({ source, level, text, ...extra });
	}

	/**
	 * Starts watching; the bot starts after the first successful build.
	 */
	public async start(): Promise<void> {
		this.#stopped = false;
		const entry = displayPath(this.config.root, this.config.entry);
		this.log('stars', 'info', this.config.build.tool === 'none' ? `Watching ${entry}` : `Watching ${entry} with ${this.config.build.tool}`);
		if (this.config.dev.typecheck.enabled) this.typechecker.start();
		await this.locales.watch();
		// The tunnel comes up next to the build: neither waits for the other, and a failed tunnel never stops the bot.
		// `--no-tunnel` only keeps it closed at start: the `t` key still opens one.
		if (this.#openTunnel !== false) void this.tunnel.start(this.#openTunnel === true);
		await this.builder.watch();
	}

	/**
	 * Restarts the bot immediately (used by the `r` key and by `SIGUSR2`).
	 */
	public restart(reason: RestartReason = 'manual'): Promise<void> {
		this.#clearRestartTimer();
		return this.#enqueue(async () => {
			if (this.#stopped) return;
			await this.#queueHook('dev:restart', reason, this.config);
			if (this.#stopped) return;
			if (!(await this.#buildSettled(reason))) return;
			if (reason === 'manual' || reason === 'crash') {
				this.#progress = { fraction: 0, message: 'restarting the bot', startedAt: Date.now(), readyMs: null };
			}
			this.#lastRestartReason = reason;
			if (this.supervisor.running) {
				this.#restarts++;
				this.log('stars', 'info', `Restarting (${describeReason(reason)})`);
				await this.supervisor.stop();
			} else {
				this.log('stars', 'info', `Starting (${describeReason(reason)})`);
			}

			// Stopping the bot takes a while, and a build may have begun meanwhile.
			if (this.#stopped || !(await this.#buildSettled(reason))) return;
			// The bot that starts now runs the latest output, so no restart is owed any more.
			this.#pendingReason = null;
			this.#progress = { ...this.#progress, fraction: 0.75, message: 'starting the bot' };
			this.#health = 'unknown';
			this.#paused = false;
			this.supervisor.start();
			this.#emitStatus();
		});
	}

	/**
	 * Stops the bot and leaves it stopped (the `d` key): builds keep running, but nothing starts the bot again until
	 * {@link restart}. For when the bot must be off without ending the session.
	 */
	public disconnect(): Promise<void> {
		this.#clearRestartTimer();
		return this.#enqueue(async () => {
			if (this.#stopped || this.#paused) return;
			this.#paused = true;
			this.log('stars', 'info', 'Stopped the bot, press r to start it again');
			await this.supervisor.stop();
			this.#emitStatus();
		});
	}

	/** Settles the pending {@link DevPrompt}: `true` does what it asks, `false` dismisses it. */
	public answerPrompt(accept: boolean): void {
		const prompt = this.#prompt;
		if (prompt === null) return;
		// The question stays open: the answer is not given up, only the redeploy is not safe yet.
		if (accept && this.#refreshBlocked()) return;
		this.#prompt = null;
		if (accept) this.refreshCommands();
		else this.log('stars', 'info', 'Kept the deployed commands as they are', { channel: 'commands' });
		this.#emitStatus();
	}

	/**
	 * Whether a refresh has to wait, saying why. While a build rewrites the output a bot that starts loads a part of the
	 * commands, and registering that would unregister the rest from Discord.
	 */
	#refreshBlocked(): boolean {
		if (this.#build !== 'building') return false;
		this.log('stars', 'warn', 'A build is running, the commands of the bot may be incomplete: answer again once it has finished', {
			channel: 'commands'
		});
		return true;
	}

	/**
	 * Resolves once no build is running, `false` when the restart is not worth doing any more: the session stopped, or
	 * an automatic restart (`build`, `initial`) had to wait for a build, whose own end already decides what happens next
	 * (a restart if it succeeded, nothing if it failed: the output would be the previous, possibly half written one).
	 * The dropped restart stays owed in {@link DevService.#pendingReason}, so that build's end restarts the bot even when
	 * it could be hot reloaded: the change the dropped restart was for is not part of what that build rewrote.
	 * A manual restart or one after a crash is still what was asked for.
	 */
	async #buildSettled(reason: RestartReason): Promise<boolean> {
		const automatic = reason === 'build' || reason === 'initial';
		let waited = false;
		while (this.#build === 'building' && !this.#stopped) {
			waited = true;
			await new Promise<void>((resolve) => this.#buildWaiters.push(resolve));
		}

		if (this.#stopped) return false;
		if (waited && automatic) {
			this.#pendingReason ??= reason;
			return false;
		}

		return true;
	}

	#releaseBuildWaiters(): void {
		const waiters = this.#buildWaiters;
		this.#buildWaiters = [];
		for (const resolve of waiters) resolve();
	}

	/** Asks the bot to register its commands with Discord again. The bot answers on the `commands` channel. */
	public refreshCommands(): void {
		if (this.#refreshBlocked()) return;
		// A bot that is stopped or restarting has no client to register anything with: the refresh waits for it to listen.
		if (!this.#ready) {
			this.#refreshPending = true;
			const when = this.supervisor.running ? 'once the bot is ready' : 'when the bot starts again';
			this.log('stars', 'info', `Refreshing commands ${when}…`, { channel: 'commands' });
			return;
		}

		this.#refreshPending = false;
		const current = this.#commands?.guilds ?? {};
		const request: RefreshRequest = {
			source: CLI_SOURCE,
			type: 'commands:refresh',
			clearGuilds: Object.keys(this.#deployed?.guilds ?? {}).filter((guild) => !Object.hasOwn(current, guild))
		};
		if (this.supervisor.send(request)) {
			this.log('stars', 'info', 'Refreshing commands…', { channel: 'commands' });
		} else {
			this.log('stars', 'warn', 'Could not reach the bot to refresh its commands', { channel: 'commands' });
		}
	}

	/** Opens or closes the public tunnel (used by the `t` key). */
	public toggleTunnel(): Promise<void> {
		return this.tunnel.toggle();
	}

	/**
	 * Stops the watcher and the bot. Safe to call more than once.
	 */
	public async stop(): Promise<void> {
		this.#stopped = true;
		this.#clearRestartTimer();
		// A restart waiting for a build must not hold the queue that closes the session.
		this.#releaseBuildWaiters();
		if (this.#healthTimer) clearInterval(this.#healthTimer);
		this.#healthTimer = null;
		await this.#enqueue(async () => {
			await Promise.allSettled([
				this.builder.close(),
				this.supervisor.stop(),
				this.typechecker.close(),
				this.tunnel.close(),
				this.locales.close()
			]);
		});
	}

	/**
	 * Kills the bot and the helper processes without waiting for them. Only for a forced shutdown, {@link stop} is the graceful path.
	 */
	public kill(): void {
		this.#stopped = true;
		this.#clearRestartTimer();
		this.#releaseBuildWaiters();
		this.supervisor.kill();
		void this.typechecker.close();
		void this.tunnel.close();
	}

	public clearLogs(): void {
		this.logs.clear();
	}

	#onBuildSuccess(outcome: BuildOutcome): void {
		// Before the locales are copied: the copy rewrites every file, which is not what the build changed.
		const hot = this.#hotReloadable();
		try {
			this.locales.copy();
		} catch (error) {
			this.#onBuildFailure({
				...outcome,
				ok: false,
				message: `Failed to copy locales: ${error instanceof Error ? error.message : String(error)}`
			});
			return;
		}
		this.#lastBuild = outcome;
		this.#progress = { ...this.#progress, fraction: 0.75, message: 'starting the bot' };
		this.#setBuild('ok');
		// Only once locales are copied: until then the build is not done, and may still fail.
		void this.#queueHook('build:done', outcome, this.config);
		if (this.#stopped) return;
		// A checker without a watch mode (`tsz`) only knows about the change once the build is through.
		this.typechecker.check();
		this.log('stars', 'success', this.builder.tool === 'none' ? 'Sources changed' : `Build succeeded in ${outcome.durationMs}ms`);
		if (this.#paused) return;
		// A restart an earlier build asked for (and a build start cleared) is still owed: its change is not in `hot`.
		if (hot !== null && this.#pendingReason === null) {
			for (const file of hot) this.log('stars', 'trace', `UPDATE ${displayPath(this.config.root, file)}`, { channel: 'hmr' });
			this.#settleProgress();
			this.#emitStatus();
			return;
		}
		this.#scheduleRestart(this.supervisor.state === 'idle' ? 'initial' : 'build');
	}

	/**
	 * The files the build rewrote when all of them are pieces the running bot hot reloads, `null` when the bot has to
	 * be restarted instead: it is not running, it does not hot reload, `dev.hmr` is off, nothing changed (a rebuild for
	 * a reason that cannot be seen from the output), or a file changed that the bot cannot replace. What a build changed
	 * is the difference in content with the previous output, since a bundler rewrites files it did not change.
	 *
	 * The bot replaces the files it loaded pieces from, and loads a new file that could be one. A helper module next to
	 * the pieces (`_shared.js`, or any file no piece came from) is imported once and stays as it was: changing it
	 * needs a restart, even though it lies in a store path.
	 */
	#hotReloadable(): string[] | null {
		if (this.config.dev.hmr === false) return null;

		const roots = this.config.build.tool === 'none' ? this.config.dev.watch : [this.config.build.outDir];
		const previous = this.#files;
		this.#files = snapshotFiles(roots, [this.locales.destination], this.#hashes);
		if (previous === null || this.#hmrPaths.length === 0 || this.supervisor.state !== 'running') return null;

		const changed = changedFiles(previous, this.#files);
		const replaceable = (file: string) =>
			this.#hmrPaths.some((path) => isInside(file, path)) && (this.#pieces.has(file) || (!previous.has(file) && couldBePiece(file)));
		return changed.length > 0 && changed.every(replaceable) ? changed : null;
	}

	#onBuildFailure(outcome: BuildOutcome): void {
		this.#lastBuild = outcome;
		void this.#queueHook('build:done', outcome, this.config);
		this.#setBuild('failed');
		this.#clearRestartTimer();
		this.log('stars', 'error', `Build failed${outcome.message ? `: ${outcome.message}` : ''}, waiting for changes`);
	}

	#onExit(exit: ProcessExit): void {
		this.#lastExit = exit;
		this.#health = 'unknown';
		this.#ready = false;
		this.#port = null;
		this.#hmrPaths = [];
		this.#pieces.clear();
		// A pending prompt stays: the commands still differ from what Discord has, and the next process can deploy them.
		if (!exit.requested) {
			const how = exit.signal ? `signal ${exit.signal}` : `code ${exit.code}`;
			this.log('stars', exit.code === 0 ? 'warn' : 'error', `The bot exited with ${how}, waiting for changes (press r to restart)`);
		}
		this.#emitStatus();
	}

	#scheduleRestart(reason: RestartReason): void {
		if (this.#paused) return;
		this.#pendingReason = reason;
		this.#clearRestartTimer();
		this.#restartTimer = setTimeout(() => {
			this.#restartTimer = null;
			const pending = this.#pendingReason ?? reason;
			this.#pendingReason = null;
			void this.restart(pending);
		}, this.config.dev.debounce);
	}

	#clearRestartTimer(): void {
		if (this.#restartTimer) clearTimeout(this.#restartTimer);
		this.#restartTimer = null;
	}

	#enqueue(task: () => Promise<void>): Promise<void> {
		this.#queue = this.#queue.then(task, task);
		return this.#queue;
	}

	#setBuild(state: BuildState): void {
		if (this.#build === state) return;
		this.#build = state;
		if (state !== 'building') this.#releaseBuildWaiters();
		this.#emitStatus();
	}

	async #checkHealth(): Promise<void> {
		if (!this.supervisor.running || !this.config.dev.url || !this.config.dev.health) return;
		const pid = this.supervisor.pid;

		let next: HealthState;
		try {
			const response = await fetch(new URL(this.config.dev.health, this.config.dev.url), { signal: AbortSignal.timeout(2000) });
			next = response.status < 500 ? 'ok' : 'down';
		} catch {
			next = 'down';
		}

		if (this.#stopped || pid !== this.supervisor.pid) return;
		if (next !== this.#health) {
			this.#health = next;
			if (next === 'ok') this.#settleProgress();
			this.#emitStatus();
		}
	}

	#settleProgress(): void {
		if (this.config.dev.health && this.#health !== 'ok') return;
		if (this.#build !== 'ok') return;
		this.#progress = {
			...this.#progress,
			fraction: 1,
			message: 'watching for changes',
			readyMs: this.#progress.readyMs ?? Date.now() - this.#progress.startedAt
		};
	}

	/** Turns what the bot reports over the bridge into log entries and status. */
	#onBridge(message: BridgeMessage): void {
		const relative = (path: string) => displayPath(this.config.root, path);
		switch (message.type) {
			case 'ready':
				this.#ready = true;
				this.#port = message.port;
				this.log('stars', 'success', message.port === null ? 'The bot is ready' : `Listening on port ${message.port}`, {
					channel: 'lifecycle'
				});
				if (this.#refreshPending) this.refreshCommands();
				this.#emitStatus();
				return;
			case 'pieces':
				for (const piece of message.pieces) this.#pieces.add(piece.path);
				if (message.pieces.length === 0) return;
				this.log('stars', 'debug', `Loaded ${message.store}: ${message.pieces.length} ${message.pieces.length === 1 ? 'piece' : 'pieces'}`, {
					channel: message.store === 'commands' ? 'commands' : 'lifecycle',
					detail: message.pieces.map((piece) => `${piece.name} ${relative(piece.path)}`)
				});
				return;
			case 'hmr':
				this.#onHmr(message);
				return;
			case 'commands':
				this.#onCommands({ global: message.global, guilds: message.guilds });
				return;
			case 'dispatch':
				if (message.phase === 'run') {
					this.log('stars', 'debug', `Processing ${message.route} with ${message.piece}`, { channel: 'interactions' });
				} else if (message.phase === 'success') {
					this.log('stars', 'trace', `${message.route} handled${formatMs(message.ms)}`, { channel: 'interactions' });
				} else {
					this.log('stars', 'error', `${message.route} failed${formatMs(message.ms)}: ${message.error.message}`, {
						channel: 'interactions',
						detail: message.error.stack
					});
				}
				return;
			case 'request':
				this.log('stars', message.status >= 500 ? 'error' : message.status >= 400 ? 'warn' : 'trace', formatRequest(message), {
					channel: 'http'
				});
				return;
			case 'refreshed':
				if (message.ok) {
					this.#deployed = this.#commands;
					const guilds =
						(message.guilds > 0 ? `, ${message.guilds} guild ${message.guilds === 1 ? 'group' : 'groups'}` : '') +
						(message.cleared > 0 ? `, cleared ${message.cleared} ${message.cleared === 1 ? 'guild' : 'guilds'}` : '');
					this.log('stars', 'success', `Deployed ${message.global} global ${message.global === 1 ? 'command' : 'commands'}${guilds}`, {
						channel: 'commands'
					});
				} else {
					this.log('stars', 'error', `Could not refresh the commands: ${message.message}`, { channel: 'commands', detail: message.stack });
				}
				return;
			case 'log':
				this.log('app', toLogLevel(message.level), message.text, { channel: message.channel, detail: message.detail });
				return;
		}
	}

	#onHmr(message: Extract<BridgeMessage, { type: 'hmr' }>): void {
		const relative = (path: string) => displayPath(this.config.root, path);
		if (message.event === 'start') {
			this.#hmrPaths = message.paths;
			this.log('stars', 'debug', `Hot reload on, watching ${message.paths.length} ${message.paths.length === 1 ? 'path' : 'paths'}`, {
				channel: 'hmr',
				detail: message.paths.map(relative)
			});
			this.#emitStatus();
			return;
		}

		if (message.event === 'stop') {
			// Nothing in the bot watches any more: the next change needs a restart again.
			this.#hmrPaths = [];
			this.log('stars', 'debug', 'Hot reload off', { channel: 'hmr' });
			this.#emitStatus();
			return;
		}

		if (message.event === 'error') {
			this.log('stars', 'error', `Could not reload ${relative(message.path)}: ${message.message}`, { channel: 'hmr', detail: message.stack });
			return;
		}

		if (message.event === 'unloaded') this.#pieces.delete(message.path);
		else this.#pieces.add(message.path);
		const verb = message.event === 'reloaded' ? 'Reloaded' : message.event === 'loaded' ? 'Loaded' : 'Unloaded';
		this.log('stars', 'debug', `${verb} ${message.names.join(', ')} from ${relative(message.path)}`, { channel: 'hmr' });
	}

	/**
	 * Compares the commands the bot registers with the ones Discord is assumed to have. The first report of a session is
	 * the baseline; a later one that differs from the report before is acted on as `dev.commands.refresh` says, with
	 * what differs from the deployed commands rather than from that report: a restart that caught the build half written
	 * reports a part of the commands, and the next one reports them all again, which is no change at all.
	 */
	#onCommands(snapshot: CommandSnapshot): void {
		const previous = this.#commands;
		this.#commands = snapshot;
		if (previous === null) {
			this.#deployed = snapshot;
			const guilds = Object.keys(snapshot.guilds).length;
			this.log('stars', 'debug', `Loaded commands: ${snapshot.global.length} global, ${guilds} guild ${guilds === 1 ? 'group' : 'groups'}`, {
				channel: 'commands',
				detail: snapshot.global.map((command) => describeCommand({ name: command.name, type: command.type ?? 1, guild: null }))
			});
			return;
		}

		// The same report again (a restart for a file that is not a command) has nothing new to say.
		if (diffSnapshots(previous, snapshot).length === 0) return;

		const changes = diffSnapshots(this.#deployed ?? previous, snapshot);
		if (changes.length === 0) {
			if (this.#prompt !== null) {
				this.#prompt = null;
				this.log('stars', 'info', 'The commands match the deployed ones again', { channel: 'commands' });
				this.#emitStatus();
			}

			return;
		}

		const detail = changes.map((change) => `${change.kind} ${describeCommand(change)}`);
		const mode = this.config.dev.commands?.refresh ?? 'prompt';
		if (mode === 'auto') {
			this.log('stars', 'info', 'Commands updated', { channel: 'commands', detail });
			this.refreshCommands();
			return;
		}

		if (mode === 'off' || !this.promptable) {
			this.log('stars', 'warn', 'Commands updated, Discord still has the previous ones', {
				channel: 'commands',
				detail: [...detail, mode === 'off' ? 'dev.commands.refresh is off' : 'Set dev.commands.refresh to "auto" to redeploy without asking']
			});
			return;
		}

		// A second change before the first was answered asks once, about all of it: `changes` already holds both.
		this.#prompt = { kind: 'commands', changes };
		this.log('stars', 'info', 'Commands updated', { channel: 'commands', detail });
		this.#emitStatus();
	}

	/**
	 * Runs a hook behind the ones already running (see {@link DevService.#hookChain}), e.g. `dev:close` so shutdown
	 * waits for an unfinished `build:done`.
	 */
	public runHook<Name extends keyof StarsHooks>(name: Name, ...args: Parameters<StarsHooks[Name]>): Promise<void> {
		return this.#queueHook(name, ...args);
	}

	/** Queues a hook behind the ones already running; see {@link DevService.#hookChain}. */
	#queueHook<Name extends keyof StarsHooks>(name: Name, ...args: Parameters<StarsHooks[Name]>): Promise<void> {
		this.#hookChain = this.#hookChain.then(() => this.#callHook(name, ...args));
		return this.#hookChain;
	}

	/**
	 * Starts a hook right away, at the moment it describes, instead of queueing it: `build:before` belongs to the
	 * builder's `start` boundary, and a builder such as `none` finishes in the same call stack. Its synchronous part
	 * runs here; later hooks still wait for the rest.
	 */
	#startHook<Name extends keyof StarsHooks>(name: Name, ...args: Parameters<StarsHooks[Name]>): Promise<void> {
		const running = this.#callHook(name, ...args);
		this.#hookChain = Promise.all([this.#hookChain, running]).then(() => undefined);
		return running;
	}

	/**
	 * Runs a `stars.config` hook. A failing hook is logged rather than thrown: a broken hook must never stop the
	 * watcher or keep the bot from restarting.
	 */
	async #callHook<Name extends keyof StarsHooks>(name: Name, ...args: Parameters<StarsHooks[Name]>): Promise<void> {
		if (this.#hooks === null) return;
		try {
			await this.#hooks.callHook(name, ...args);
		} catch (error) {
			this.log('stars', 'error', `Hook ${name} failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	#emitStatus(): void {
		this.emit('status', this.status);
	}
}

export function createSupervisor(config: ResolvedStarsConfig): ProcessSupervisor {
	return new ProcessSupervisor({
		command: process.execPath,
		args: [
			...envImportArgs(config),
			...moduleImportArgs(config),
			...bridgeImportArgs(config),
			...config.dev.nodeArgs,
			config.build.output,
			...config.dev.args
		],
		cwd: config.root,
		env: {
			...process.env,
			...config.dev.env,
			STARS_DEV: '1',
			NODE_ENV: 'development',
			FORCE_COLOR: process.env.NO_COLOR !== undefined ? undefined : (process.env.FORCE_COLOR ?? (process.stdout.isTTY ? '1' : undefined))
		},
		killTimeout: config.dev.killTimeout,
		ipc: true
	});
}

function formatMs(ms: number | null): string {
	return ms === null ? '' : ` in ${ms}ms`;
}

function formatRequest(message: Extract<BridgeMessage, { type: 'request' }>): string {
	return `${message.method} ${message.path} ${message.status} in ${message.ms}ms`;
}

const BRIDGE_LEVELS = new Set<string>(['trace', 'debug', 'info', 'success', 'warn', 'error']);

function toLogLevel(level: string): LogLevel {
	return BRIDGE_LEVELS.has(level) ? (level as LogLevel) : 'info';
}

export function describeReason(reason: RestartReason): string {
	switch (reason) {
		case 'initial':
			return 'first build';
		case 'build':
			return 'sources changed';
		case 'manual':
			return 'manual restart';
		case 'crash':
			return 'after crash';
	}
}
