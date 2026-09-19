import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { EventEmitter } from 'node:events';
import { pluginRegistrations } from '../utils/plugin-registrations.js';
import { importFromProject } from '../utils/project.js';
import type { Builder, BuilderEvents, BuildOutcome } from './types.js';

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
 * `vite.config.*`/`stars.config#vite` the same way {@link import('./vite.js').ViteBuilder} does, and only adds the
 * `nitro()` plugin and a generated server entry on top. That entry re-exports the project's `Client` instance (the
 * entry's default export, already `load()`ed — see {@link import('@wolfstar/http-framework/config').StarsExperimentalConfig.enableNitro})
 * through `@wolfstar/http-framework/fetch`'s `createFetchHandler`, in the plain `{ fetch(Request): Promise<Response> }`
 * shape Nitro's own server entry convention expects — no per-preset adapter to maintain.
 */
export class NitroBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'vite' as const;
	#startedAt = 0;
	#watcher: { close(): Promise<void> } | null = null;

	public constructor(private readonly config: ResolvedStarsConfig) {
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
			importFromProject<ViteModule>(this.config.root, 'vite', VITE_INSTALL_HINT),
			importFromProject<NitroViteModule>(this.config.root, 'nitro/vite', NITRO_INSTALL_HINT)
		]);
		return { vite, nitro };
	}

	/**
	 * Same merge `ViteBuilder` uses (`stars.config#vite` layered over the project's own `vite.config.*`), with the
	 * `nitro()` plugin appended — after the project's own plugins, so a `nitro:` block a project adds itself to
	 * `vite.config.*` is still free to run its own `setup` hooks against the instance this creates.
	 */
	#options(vite: ViteModule, nitroVite: NitroViteModule): Parameters<ViteModule['createBuilder']>[0] {
		return {
			root: this.config.root,
			logLevel: 'warn',
			customLogger: this.#logger(vite),
			...this.config.vite,
			plugins: [
				pluginRegistrations(this.config),
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
	 * `createFetchHandler` is built once per process and reused across requests — the same lifetime `Client.listen()`
	 * gives its own `node:http` server, and required since re-deriving the Discord signing key on every request would
	 * make every reply pay for an extra async hop.
	 */
	#entryCode(): string {
		return [
			"import { createFetchHandler } from '@wolfstar/http-framework/fetch';",
			`import client from ${JSON.stringify(this.config.entry)};`,
			'',
			'const handlerPromise = createFetchHandler(client);',
			'export default {',
			'\tasync fetch(request) {',
			'\t\tconst handler = await handlerPromise;',
			'\t\treturn handler(request);',
			'\t}',
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
