import type { BuilderContext, ResolvedStarsConfig } from '@wolfstar/schema';
import type { NitroConfig } from 'nitro/types';
import type { InlineConfig, Plugin, UserConfig } from 'vite';
import { defaultBuilderContext, toArray, type ViteModule } from '@wolfstar/vite-server/internal';

export const NITRO_ENTRY_ID = '#stars/nitro-entry';
export type NitroViteModule = typeof import('nitro/vite');
export interface NitroHooks {
	configureNitro?(options: NitroConfig): void | Promise<void>;
	configureVite?(options: InlineConfig, command: 'build' | 'serve'): void | Promise<void>;
}

/** Type-check all upstream Nitro options without adding Nitro to the shared schema runtime. */
export function defineNitroConfig(config: NitroConfig): NitroConfig {
	return config;
}

export function createNitroConfig(config: ResolvedStarsConfig): NitroConfig {
	const raw = config.experimental.nitro as NitroConfig;
	return {
		...raw,
		rootDir: config.root,
		preset: config.experimental.nitro.preset,
		output: { ...raw.output, dir: config.build.outDir },
		serverEntry: NITRO_ENTRY_ID,
		virtual: {
			...raw.virtual,
			[NITRO_ENTRY_ID]: () =>
				[
					`import client from ${JSON.stringify(config.entry)};`,
					'if (typeof client?.fetch !== "function") throw new TypeError("The Stars Nitro entry must default-export an object with fetch(request).");',
					'export default { fetch: (request) => client.fetch(request) };'
				].join('\n')
		}
	};
}

export async function createNitroViteConfig(
	config: ResolvedStarsConfig,
	context: BuilderContext = defaultBuilderContext,
	hooks: NitroHooks = {},
	command: 'build' | 'serve' = 'build'
): Promise<{ vite: ViteModule; options: InlineConfig }> {
	const [vite, nitro] = await Promise.all([
		context.importFromProject<ViteModule>(config.root, 'vite', 'Install it with `pnpm add -D vite`.'),
		context.importFromProject<NitroViteModule>(config.root, 'nitro/vite', 'Install it with `pnpm add -D nitro`.')
	]);
	const nitroConfig = createNitroConfig(config);
	await hooks.configureNitro?.(nitroConfig);
	const inline = config.vite as UserConfig;
	const options: InlineConfig = {
		...inline,
		root: config.root,
		configFile: config.build.configFile ?? false,
		resolve: { tsconfigPaths: true, ...inline.resolve },
		plugins: [context.pluginRegistrations(config) as Plugin, ...toArray(inline.plugins), ...nitro.nitro(nitroConfig)]
	};
	await hooks.configureVite?.(options, command);
	return { vite, options };
}
