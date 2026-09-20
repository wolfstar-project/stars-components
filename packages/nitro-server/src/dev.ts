import type { BuilderContext, ResolvedStarsConfig } from '@wolfstar/schema';
import type { Nitro } from 'nitro/types';
import type { InlineConfig, Plugin, UserConfig, ViteDevServer } from 'vite';
import { defaultBuilderContext, toArray, type ViteModule } from '@wolfstar/vite-server/internal';
import { createNitroConfig, type NitroHooks, type NitroViteModule } from './config.js';

export type NitroBuilderModule = typeof import('nitro/builder');

export interface StarsNitroServer {
	readonly vite: ViteDevServer;
	/** The Nitro instance backing this server: routing, hooks, logger, and runtime config live here. */
	readonly nitro: Nitro;
	/** Dispatch through Nitro's own router, bypassing the HTTP socket entirely. */
	fetch(request: Request): Promise<Response>;
	listen(port?: number): Promise<void>;
	close(): Promise<void>;
}

/**
 * Native Nitro development through its Vite plugin: server routes, HMR reload, and runtime dispatch.
 *
 * A Nitro instance is created upfront and handed to the plugin via its `_nitro` option, the same
 * extension point framework integrations like Nuxt rely on. Owning that instance is what lets
 * {@link close} tear down Nitro's own watchers and hooks (they only run when its `close()` is
 * called) and lets {@link StarsNitroServer.fetch} dispatch requests without a listening socket.
 */
export async function createNitroServer(
	config: ResolvedStarsConfig,
	context: BuilderContext = defaultBuilderContext,
	hooks: NitroHooks = {}
): Promise<StarsNitroServer> {
	const [vite, nitroVite, nitroBuilder] = await Promise.all([
		context.importFromProject<ViteModule>(config.root, 'vite', 'Install it with `pnpm add -D vite`.'),
		context.importFromProject<NitroViteModule>(config.root, 'nitro/vite', 'Install it with `pnpm add -D nitro`.'),
		context.importFromProject<NitroBuilderModule>(config.root, 'nitro/builder', 'Install it with `pnpm add -D nitro`.')
	]);
	const nitroConfig = createNitroConfig(config);
	nitroConfig.dev ??= true;
	nitroConfig.builder ??= 'vite';
	await hooks.configureNitro?.(nitroConfig);
	const nitro = await nitroBuilder.createNitro(nitroConfig);
	const inline = config.vite as UserConfig;
	const options: InlineConfig = {
		...inline,
		root: config.root,
		configFile: config.build.configFile ?? false,
		resolve: { tsconfigPaths: true, ...inline.resolve },
		plugins: [context.pluginRegistrations(config) as Plugin, ...toArray(inline.plugins), ...nitroVite.nitro({ ...nitroConfig, _nitro: nitro })]
	};
	const url = new URL(config.dev.url ?? 'http://localhost:3000');
	options.appType = 'custom';
	options.mode ??= 'development';
	options.server = { host: url.hostname, port: Number(url.port || 3000), ...options.server };
	await hooks.configureVite?.(options, 'serve');
	const viteServer = await vite.createServer(options);
	let closed = false;
	let closing: Promise<void> | undefined;
	return {
		vite: viteServer,
		nitro,
		async fetch(request) {
			if (closed) return new Response('Server closed', { status: 503 });
			return nitro.fetch(request);
		},
		async listen(port) {
			if (closed) throw new Error('The server is closed.');
			await viteServer.listen(port);
		},
		close() {
			closed = true;
			// Nitro's own watchers and hooks (registered by its Vite plugin) only run once its
			// close() fires; vite.close() alone would leak them.
			closing ??= (async () => {
				await viteServer.close();
				await nitro.close();
			})();
			return closing;
		}
	};
}
