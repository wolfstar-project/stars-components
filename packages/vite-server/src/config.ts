import { basename } from 'node:path';
import type { BuilderContext, ResolvedStarsConfig } from '@wolfstar/schema';
import type { InlineConfig, Plugin, UserConfig } from 'vite';
import { defaultBuilderContext } from './context.js';

export type ViteModule = typeof import('vite');
export interface ViteHooks {
	configure?(options: InlineConfig, command: 'build' | 'serve'): void | Promise<void>;
}

/** Defaults are applied after Vite loads its config, so explicit project options win. */
export function createViteConfig(config: ResolvedStarsConfig, context: BuilderContext = defaultBuilderContext): InlineConfig {
	const defaults: Plugin = {
		name: 'stars:server-defaults',
		enforce: 'pre',
		config(options) {
			options.build ??= {};
			options.build.ssr ??= config.entry;
			options.build.outDir ??= config.build.outDir;
			options.build.sourcemap ??= true;
			options.build.rollupOptions ??= {};
			const output = options.build.rollupOptions.output;
			if (!Array.isArray(output)) options.build.rollupOptions.output = { entryFileNames: basename(config.build.output), ...output };
			options.resolve ??= {};
			options.resolve.tsconfigPaths ??= true;
		}
	};
	const inline = config.vite as UserConfig;
	return {
		...inline,
		root: config.root,
		configFile: config.build.configFile ?? false,
		plugins: [defaults, context.pluginRegistrations(config) as Plugin, ...toArray(inline.plugins)]
	};
}

export function toArray<T>(value: T | T[] | undefined): T[] {
	return value === undefined ? [] : Array.isArray(value) ? value : [value];
}
