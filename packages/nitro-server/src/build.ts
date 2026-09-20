import { join, relative, resolve, isAbsolute } from 'node:path';
import type { BuilderContext, ResolvedStarsConfig } from '@wolfstar/schema';
import { ServerBuilder, createBuildLogger, type ServerHooks } from '@wolfstar/vite-server/internal';
import picomatch from 'picomatch';
import { createNitroViteConfig, type NitroHooks } from './config.js';

export interface NitroBuilderHooks extends ServerHooks, NitroHooks {}
export class NitroBuilder extends ServerBuilder {
	public constructor(
		config: ResolvedStarsConfig,
		context?: BuilderContext,
		protected override readonly hooks: NitroBuilderHooks = {}
	) {
		super(config, context, hooks);
	}
	protected async compile(): Promise<void> {
		const { vite, options } = await createNitroViteConfig(this.config, this.context, this.hooks);
		options.customLogger ??= createBuildLogger(vite, (level, text) => {
			this.emit('log', level, text);
		});
		options.build = { ...options.build, watch: null };
		this.emit('progress', 0.2, 'building Nitro server');
		const builder = await vite.createBuilder(options, null);
		await builder.buildApp();
	}
	protected async startWatching(): Promise<void> {
		const { watch } = await import('chokidar');
		if (this.closed) return;
		const config = this.config;
		const ignored = picomatch([...config.dev.ignore], { dot: true });
		const output = resolve(config.build.outDir);
		const paths = [...config.dev.watch, join(config.root, 'package.json'), ...(config.build.configFile ? [config.build.configFile] : [])];
		const watcher = watch(paths, {
			ignoreInitial: true,
			ignored(path) {
				const absolute = resolve(path);
				const fromOutput = relative(output, absolute);
				const local = relative(config.root, absolute).replaceAll('\\', '/');
				return (
					fromOutput === '' ||
					(!fromOutput.startsWith('..') && !isAbsolute(fromOutput)) ||
					/(^|\/)(node_modules|\.git|\.stars)(\/|$)/.test(local) ||
					ignored(local) ||
					ignored(`${local}/`) ||
					ignored(absolute)
				);
			}
		});
		let timer: ReturnType<typeof setTimeout> | undefined;
		let dirty = false;
		let rebuilding: Promise<void> | undefined;
		const rebuild = async () => {
			do {
				dirty = false;
				if (this.closed) return;
				await this.build();
			} while (dirty && !this.closed);
		};
		const schedule = () => {
			dirty = true;
			if (this.closed || rebuilding) return;
			clearTimeout(timer);
			timer = setTimeout(() => {
				timer = undefined;
				rebuilding = rebuild()
					.catch((error) => {
						if (!this.closed) this.emit('log', 'error', String(error));
					})
					.finally(() => {
						rebuilding = undefined;
					});
			}, config.dev.debounce);
		};
		this.stopWatching = async () => {
			clearTimeout(timer);
			await watcher.close();
			await rebuilding;
		};
		watcher.on('all', schedule);
		watcher.on('error', (error) => this.emit('log', 'error', String(error)));
		await new Promise<void>((accept, reject) => {
			const onError = (error: unknown) => reject(error);
			watcher.once('error', onError);
			watcher.once('ready', () => {
				watcher.off('error', onError);
				accept();
			});
		});
		if (!this.closed) {
			rebuilding = rebuild().finally(() => {
				rebuilding = undefined;
			});
			await rebuilding;
		}
	}
}
