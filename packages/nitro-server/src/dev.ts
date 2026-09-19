import type { BuilderContext, ResolvedStarsConfig } from '@wolfstar/schema';
import type { ViteDevServer } from 'vite';
import { createNitroViteConfig, type NitroHooks } from './config.js';

/** Native Nitro development through its Vite plugin, including server routes and runtime reload. */
export async function createNitroServer(config: ResolvedStarsConfig, context?: BuilderContext, hooks?: NitroHooks): Promise<ViteDevServer> {
	const { vite, options } = await createNitroViteConfig(config, context, hooks, 'serve');
	const url = new URL(config.dev.url ?? 'http://localhost:3000');
	options.appType = 'custom';
	options.mode ??= 'development';
	options.server = { host: url.hostname, port: Number(url.port || 3000), ...options.server };
	return vite.createServer(options);
}
