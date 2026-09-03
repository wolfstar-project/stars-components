import type { ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import { EventEmitter } from 'node:events';
import { importFromProject } from '../project.js';
import type { Builder, BuilderEvents, BuildOutcome } from './types.js';

type ViteModule = typeof import('vite');
type RollupWatcher =
	Awaited<ReturnType<ViteModule['build']>> extends infer Result
		? Result extends { close: () => Promise<void>; on: (...args: never[]) => unknown }
			? Result
			: never
		: never;

const INSTALL_HINT = "Install it with `pnpm add -D vite`, or set `build.tool` to 'tsdown', 'tsc' or 'none'.";

/**
 * Builds through the project's own `vite`, honouring its `vite.config.*`.
 *
 * Guarded by `experimental.enableVite`: Vite replaces `tsdown` as the bundler and, with the framework's Fetch
 * adapter, the `node:http` listener too, so a project can serve its interactions endpoint the same way it serves
 * everything else.
 */
export class ViteBuilder extends EventEmitter<BuilderEvents> implements Builder {
	public readonly tool = 'vite' as const;
	#watcher: RollupWatcher | null = null;
	#startedAt = 0;

	public constructor(private readonly config: ResolvedStarsConfig) {
		super();
	}

	public async build(): Promise<BuildOutcome> {
		const vite = await this.#load();
		this.#begin();

		try {
			await vite.build({ root: this.config.root, logLevel: 'warn', customLogger: this.#logger(vite) });
			return this.#finish(null);
		} catch (error) {
			return this.#finish(error instanceof Error ? error.message : String(error));
		}
	}

	public async watch(): Promise<void> {
		const vite = await this.#load();
		this.#begin();

		// `build.watch` makes Vite return a rollup watcher instead of resolving once, which is what keeps the bot
		// rebuilding on change; every rebuild reports through the same events the other builders use.
		const result = (await vite.build({
			root: this.config.root,
			logLevel: 'warn',
			customLogger: this.#logger(vite),
			build: { watch: {} }
		})) as unknown as RollupWatcher;

		this.#watcher = result;
		result.on(
			'event' as never,
			((event: { code: string; error?: Error }) => {
				switch (event.code) {
					case 'BUNDLE_START':
						return this.#begin();
					case 'BUNDLE_END':
						return void this.#finish(null);
					case 'ERROR':
						return void this.#finish(event.error?.message ?? 'The build reported errors');
					default:
						break;
				}
			}) as never
		);
	}

	public async close(): Promise<void> {
		const watcher = this.#watcher;
		this.#watcher = null;
		await watcher?.close();
	}

	async #load(): Promise<ViteModule> {
		return importFromProject<ViteModule>(this.config.root, 'vite', INSTALL_HINT);
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
