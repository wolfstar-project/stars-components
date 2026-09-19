import type { Builder, BuilderContext, BuilderEvents, BuildOutcome, ResolvedStarsConfig } from '@wolfstar/schema';
import { EventEmitter } from 'node:events';

type ViteModule = typeof import('vite');
type NitroViteModule = typeof import('nitro/vite');

const VITE_INSTALL_HINT = 'Install it with `pnpm add -D vite`, or turn off `experimental.enableNitro`.';
const NITRO_INSTALL_HINT = 'Install it with `pnpm add -D nitro`, or turn off `experimental.enableNitro`.';

/**
 * The virtual module registered as Nitro's `serverEntry` (see `nitro.build/docs/server-entry`): a `#`-prefixed id
 * is never resolved against the filesystem (`resolveNitroPath` in Nitro itself special-cases it), so this never
 * collides with a real project file.
 */
const ENTRY_VIRTUAL_ID = '#stars/nitro-entry';

/**
 * Builds the bot through [Nitro](https://nitro.build)'s Vite plugin (`nitro/vite`), the way `enableNitro` promises:
 * `stars build` produces `build.outDir` (`.output` by default) laid out for the configured preset, deployable to
 * anything Nitro targets, instead of a `node:http` process.
 *
 * Nitro v3 is itself a Vite plugin — there is no separate `nitro build` step — so this reuses the project's own
 * `vite.config.*`/`stars.config#vite` the same way `@wolfstar/vite-server` does, and only adds the
 * `nitro()` plugin and a generated server entry on top. That entry imports the project's `Client` instance (the
 * entry's default export, already `load()`ed — see {@link import('@wolfstar/schema').StarsExperimentalConfig.enableNitro})
 * and calls its `fetch(request)` method, in the plain `{ fetch(Request): Promise<Response> }` shape Nitro's own
 * server entry convention expects — no separate adapter module to maintain, `Client` handles Fetch requests itself.
 */
export class NitroBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'vite' as const;
	#startedAt = 0;
	#watcher: { close(): Promise<void> } | null = null;

	public constructor(
		private readonly config: ResolvedStarsConfig,
		private readonly context: BuilderContext
	) {
		super();
	}

	public async build(): Promise<BuildOutcome> {
		const { vite, nitro } = await this.#load();
		this.#begin();

		try {
			const builder = await vite.createBuilder(this.#options(vite, nitro), null);
			await builder.buildApp();
			return this.#finish(null);
		} catch (error) {
			return this.#finish(error instanceof Error ? error.message : String(error));
		}
	}

	public async watch(): Promise<void> {
		const { watch } = await import('chokidar');

		const watcher = watch([...this.config.dev.watch], { ignored: [...this.config.dev.ignore], ignoreInitial: true });
		this.#watcher = watcher;
		watcher.on('all', () => void this.build());
		watcher.on('error', (error) => this.emit('log', 'error', error instanceof Error ? error.message : String(error)));

		await new Promise<void>((resolve) => watcher.once('ready', resolve));
		await this.build();
	}

	public async close(): Promise<void> {
		const watcher = this.#watcher;
		this.#watcher = null;
		await watcher?.close();
	}

	async #load(): Promise<{ vite: ViteModule; nitro: NitroViteModule }> {
		const [vite, nitro] = await Promise.all([
			this.context.importFromProject<ViteModule>(this.config.root, 'vite', VITE_INSTALL_HINT),
			this.context.importFromProject<NitroViteModule>(this.config.root, 'nitro/vite', NITRO_INSTALL_HINT)
		]);
		return { vite, nitro };
	}

	/**
	 * Same merge `ViteBuilder` uses (`stars.config#vite` layered over the project's own `vite.config.*`), with the
	 * `nitro()` plugin appended — after the project's own plugins, so a `nitro:` block a project adds itself to
	 * `vite.config.*` is still free to run its own `setup` hooks against the instance this creates — and Vite's
	 * native `resolve.tsconfigPaths` turned on (see https://nitro.build/examples/import-alias): the project's own
	 * `tsconfig.json#paths`/package.json `imports` aliases (including `.stars/tsconfig.json`'s generated ones) just
	 * work under Nitro, without a `vite-tsconfig-paths` plugin. `false` in the project's own `vite.resolve` still
	 * wins, the same as every other default here.
	 */
	#options(vite: ViteModule, nitroVite: NitroViteModule): Parameters<ViteModule['createBuilder']>[0] {
		return {
			root: this.config.root,
			logLevel: 'warn',
			customLogger: this.#logger(vite),
			...this.config.vite,
			resolve: { tsconfigPaths: true, ...(this.config.vite.resolve as Record<string, unknown> | undefined) },
			plugins: [
				this.context.pluginRegistrations(this.config),
				...toArray(this.config.vite.plugins),
				nitroVite.nitro({
					preset: this.config.experimental.nitro.preset,
					output: { dir: this.config.build.outDir },
					serverEntry: ENTRY_VIRTUAL_ID,
					virtual: { [ENTRY_VIRTUAL_ID]: () => this.#entryCode() }
				})
			]
		} as Parameters<ViteModule['createBuilder']>[0];
	}

	/**
	 * `client.fetch` imports the Discord public key once and reuses it across every call — the same lifetime
	 * `Client.listen()` gives its own `node:http` server — so the generated entry only has to forward the request.
	 */
	#entryCode(): string {
		return [
			`import client from ${JSON.stringify(this.config.entry)};`,
			'',
			'export default {',
			'\tfetch: (request) => client.fetch(request)',
			'};',
			''
		].join('\n');
	}

	#logger(vite: ViteModule) {
		const logger = vite.createLogger('warn', { allowClearScreen: false });
		return {
			...logger,
			info: (message: string) => this.emit('log', 'info', message),
			warn: (message: string) => this.emit('log', 'warn', message),
			warnOnce: (message: string) => this.emit('log', 'warn', message),
			error: (message: string) => this.emit('log', 'error', message)
		};
	}

	#begin(): void {
		this.#startedAt = performance.now();
		this.emit('start');
	}

	#finish(message: string | null): BuildOutcome {
		const outcome: BuildOutcome = { ok: message === null, durationMs: Math.round(performance.now() - this.#startedAt), message };
		this.#startedAt = 0;
		this.emit(outcome.ok ? 'success' : 'failure', outcome);
		return outcome;
	}
}

function toArray(value: unknown): unknown[] {
	if (value === undefined || value === null || value === false) return [];
	return Array.isArray(value) ? value : [value];
}
