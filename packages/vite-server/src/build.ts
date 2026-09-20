import type { BuilderContext, BuildOutcome, ResolvedStarsConfig } from '@wolfstar/schema';
type ViteWatcher = Extract<Awaited<ReturnType<ViteModule['build']>>, { on: unknown }>;
import { createViteConfig, type ViteHooks, type ViteModule } from './config.js';
import { ServerBuilder, type ServerHooks } from './lifecycle.js';
import { createBuildLogger } from './logger.js';

export interface ViteBuilderHooks extends ServerHooks, ViteHooks {}
export class ViteBuilder extends ServerBuilder {
	public constructor(
		config: ResolvedStarsConfig,
		context?: BuilderContext,
		protected override readonly hooks: ViteBuilderHooks = {}
	) {
		super(config, context, hooks);
	}
	async #options(command: 'build' | 'serve' = 'build') {
		const vite = await this.context.importFromProject<ViteModule>(this.config.root, 'vite', 'Install it with `pnpm add -D vite`.');
		const options = createViteConfig(this.config, this.context);
		options.customLogger = createBuildLogger(vite, (level, text) => {
			this.emit('log', level, text);
		});
		await this.hooks.configure?.(options, command);
		return { vite, options };
	}
	protected async compile(): Promise<void> {
		const { vite, options } = await this.#options();
		// A one-shot build must not accidentally create a persistent watcher.
		options.build = { ...options.build, watch: null };
		this.emit('progress', 0.2, 'building server with Vite');
		await vite.build(options);
	}
	protected async startWatching(): Promise<void> {
		const { vite, options } = await this.#options();
		if (this.closed) return;
		options.plugins ??= [];
		options.plugins.push({ name: 'stars:watch-hooks', buildStart: () => this.hooks.beforeBuild?.(this.config) });
		let started = performance.now();
		let queue = Promise.resolve();
		const watcher = (await vite.build({ ...options, build: { ...options.build, watch: options.build?.watch ?? {} } })) as ViteWatcher;
		this.stopWatching = async () => {
			await watcher.close();
			await queue;
		};
		watcher.on('event', (event) => {
			if (this.closed) return;
			if (event.code === 'START') {
				started = performance.now();
				this.emit('start');
			}
			if (event.code === 'BUNDLE_END') void event.result.close().catch((error) => this.emit('log', 'error', String(error)));
			if (event.code !== 'END' && event.code !== 'ERROR') return;
			const outcome: BuildOutcome = {
				ok: event.code === 'END',
				durationMs: Math.round(performance.now() - started),
				message: event.code === 'ERROR' ? event.error.message : null
			};
			queue = queue.then(async () => {
				try {
					await this.hooks.afterBuild?.(outcome);
				} catch (error) {
					outcome.ok = false;
					outcome.message = String(error);
				}
				if (!this.closed) this.emit(outcome.ok ? 'success' : 'failure', outcome);
			});
		});
	}
}
