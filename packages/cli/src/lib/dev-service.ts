import { EventEmitter } from 'node:events';
import type { Builder, BuildOutcome } from './builders/types.js';
import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { LogBuffer, type LogLevel, type LogSource } from './log-buffer.js';
import { ProcessSupervisor, type ProcessExit, type ProcessState } from './process-supervisor.js';
import { Tunnel, type TunnelState } from './tunnel.js';
import { Typechecker, type TypecheckState } from './typechecker.js';

export type BuildState = 'idle' | 'building' | 'ok' | 'failed';
export type HealthState = 'unknown' | 'ok' | 'down';
export type RestartReason = 'initial' | 'build' | 'manual' | 'crash';

export interface DevStatus {
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
}

export interface DevServiceEvents {
	status: [status: DevStatus];
}

export interface DevServiceOptions {
	builder: Builder;
	logs?: LogBuffer;
	/** Overrides for tests. */
	supervisor?: ProcessSupervisor;
	typechecker?: Typechecker;
	tunnel?: Tunnel;
	healthInterval?: number;
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

	#build: BuildState = 'idle';
	#health: HealthState = 'unknown';
	#restarts = 0;
	#lastRestartReason: RestartReason | null = null;
	#lastBuild: BuildOutcome | null = null;
	#lastExit: ProcessExit | null = null;
	#restartTimer: NodeJS.Timeout | null = null;
	#healthTimer: NodeJS.Timeout | null = null;
	#pendingReason: RestartReason | null = null;
	#stopped = false;
	#queue: Promise<void> = Promise.resolve();

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

		this.builder.on('start', () => this.#setBuild('building'));
		this.builder.on('success', (outcome) => this.#onBuildSuccess(outcome));
		this.builder.on('failure', (outcome) => this.#onBuildFailure(outcome));
		this.builder.on('log', (level, text) => this.log('build', level, text));

		this.supervisor.on('state', () => this.#emitStatus());
		this.supervisor.on('stdout', (line) => this.log('app', 'info', line));
		this.supervisor.on('stderr', (line) => this.log('app', 'error', line));
		this.supervisor.on('error', (error) => this.log('stars', 'error', `Failed to start the bot: ${error.message}`));
		this.supervisor.on('exit', (exit) => this.#onExit(exit));

		this.typechecker.on('log', (level, text) => this.log('tsc', level, text));
		this.typechecker.on('state', () => this.#emitStatus());
		this.tunnel.on('log', (level, text) => this.log('tunnel', level, text));
		this.tunnel.on('state', () => this.#emitStatus());

		if (config.dev.url && config.dev.health) {
			const interval = options.healthInterval ?? 5000;
			this.#healthTimer = setInterval(() => void this.#checkHealth(), interval);
			this.#healthTimer.unref();
		}
	}

	public get status(): DevStatus {
		return {
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
			tunnelUrl: this.tunnel.url
		};
	}

	public log(source: LogSource, level: LogLevel, text: string): void {
		this.logs.push({ source, level, text });
	}

	/**
	 * Starts watching; the bot starts after the first successful build.
	 */
	public async start(): Promise<void> {
		this.#stopped = false;
		this.log(
			'stars',
			'info',
			`Watching ${this.config.build.tool === 'none' ? 'sources' : `with ${this.config.build.tool}`}, entry ${this.config.entry}`
		);
		if (this.config.dev.typecheck.enabled) this.typechecker.start();
		// The tunnel comes up next to the build: neither waits for the other, and a failed tunnel never stops the bot.
		void this.tunnel.start();
		await this.builder.watch();
	}

	/**
	 * Restarts the bot immediately (used by the `r` key and by `SIGUSR2`).
	 */
	public restart(reason: RestartReason = 'manual'): Promise<void> {
		this.#clearRestartTimer();
		return this.#enqueue(async () => {
			if (this.#stopped) return;
			this.#lastRestartReason = reason;
			if (this.supervisor.running) {
				this.#restarts++;
				this.log('stars', 'info', `Restarting (${describeReason(reason)})`);
				await this.supervisor.stop();
			} else {
				this.log('stars', 'info', `Starting (${describeReason(reason)})`);
			}

			if (this.#stopped) return;
			this.supervisor.start();
			this.#health = 'unknown';
			this.#emitStatus();
		});
	}

	/**
	 * Stops the watcher and the bot. Safe to call more than once.
	 */
	public async stop(): Promise<void> {
		this.#stopped = true;
		this.#clearRestartTimer();
		if (this.#healthTimer) clearInterval(this.#healthTimer);
		this.#healthTimer = null;
		await this.#enqueue(async () => {
			await Promise.allSettled([this.builder.close(), this.supervisor.stop(), this.typechecker.close(), this.tunnel.close()]);
		});
	}

	public clearLogs(): void {
		this.logs.clear();
	}

	#onBuildSuccess(outcome: BuildOutcome): void {
		this.#lastBuild = outcome;
		this.#setBuild('ok');
		if (this.#stopped) return;
		// A checker without a watch mode (`tsz`) only knows about the change once the build is through.
		this.typechecker.check();
		this.log('stars', 'success', this.builder.tool === 'none' ? 'Sources changed' : `Build succeeded in ${outcome.durationMs}ms`);
		this.#scheduleRestart(this.supervisor.state === 'idle' ? 'initial' : 'build');
	}

	#onBuildFailure(outcome: BuildOutcome): void {
		this.#lastBuild = outcome;
		this.#setBuild('failed');
		this.#clearRestartTimer();
		this.log('stars', 'error', `Build failed${outcome.message ? `: ${outcome.message}` : ''}, waiting for changes`);
	}

	#onExit(exit: ProcessExit): void {
		this.#lastExit = exit;
		this.#health = 'unknown';
		if (!exit.requested) {
			const how = exit.signal ? `signal ${exit.signal}` : `code ${exit.code}`;
			this.log('stars', exit.code === 0 ? 'warn' : 'error', `The bot exited with ${how}, waiting for changes (press r to restart)`);
		}
		this.#emitStatus();
	}

	#scheduleRestart(reason: RestartReason): void {
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
		this.#emitStatus();
	}

	async #checkHealth(): Promise<void> {
		if (!this.supervisor.running || !this.config.dev.url || !this.config.dev.health) return;

		let next: HealthState;
		try {
			const response = await fetch(new URL(this.config.dev.health, this.config.dev.url), { signal: AbortSignal.timeout(2000) });
			next = response.status < 500 ? 'ok' : 'down';
		} catch {
			next = 'down';
		}

		if (next !== this.#health) {
			this.#health = next;
			this.#emitStatus();
		}
	}

	#emitStatus(): void {
		this.emit('status', this.status);
	}
}

export function createSupervisor(config: ResolvedStarsConfig): ProcessSupervisor {
	return new ProcessSupervisor({
		command: process.execPath,
		args: [...config.dev.nodeArgs, config.build.output, ...config.dev.args],
		cwd: config.root,
		env: { ...process.env, ...config.dev.env, STARS_DEV: '1', FORCE_COLOR: process.env.FORCE_COLOR ?? (process.stdout.isTTY ? '1' : undefined) },
		killTimeout: config.dev.killTimeout
	});
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
