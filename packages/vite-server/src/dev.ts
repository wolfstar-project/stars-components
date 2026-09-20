import type { IncomingMessage, ServerResponse } from 'node:http';
import type { BuilderContext, ResolvedStarsConfig } from '@wolfstar/schema';
import type { ViteDevServer } from 'vite';
import { toNodeHandler } from 'srvx/node';
import { createViteConfig, type ViteHooks, type ViteModule } from './config.js';
import { defaultBuilderContext } from './context.js';

export interface StarsViteServer {
	readonly vite: ViteDevServer;
	/** Dispatch through Vite's SSR graph; changed modules are reloaded by Vite. */
	fetch(request: Request): Promise<Response>;
	listen(port?: number): Promise<void>;
	close(): Promise<void>;
}

/** A native Vite development server for an entry exporting a loaded Client (or any Fetch handler). */
export async function createViteServer(
	config: ResolvedStarsConfig,
	context: BuilderContext = defaultBuilderContext,
	hooks: ViteHooks = {}
): Promise<StarsViteServer> {
	const viteModule = await context.importFromProject<ViteModule>(config.root, 'vite', 'Install it with `pnpm add -D vite`.');
	const options = createViteConfig(config, context);
	const url = new URL(config.dev.url ?? 'http://localhost:3000');
	options.appType = 'custom';
	options.mode ??= 'development';
	options.server = { host: url.hostname, port: Number(url.port || 3000), ...options.server };
	await hooks.configure?.(options, 'serve');
	let vite: ViteDevServer;
	let closed = false;
	let closing: Promise<void> | undefined;
	const pending = new Set<Promise<Response>>();
	const fetchRequest = async (request: Request): Promise<Response> => {
		if (closed) return new Response('Server closed', { status: 503 });
		try {
			const entry = await vite.ssrLoadModule(config.entry);
			const app = entry.default as { fetch?: (request: Request) => Response | Promise<Response> } | undefined;
			if (typeof app?.fetch !== 'function')
				throw new TypeError(
					'The Stars server entry must default-export an object with fetch(request). Use client.load(), not client.listen().'
				);
			return await app.fetch(request);
		} catch (error) {
			if (error instanceof Error) vite.ssrFixStacktrace(error);
			vite.config.logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
			return new Response('Internal Server Error', { status: 500 });
		}
	};
	const fetch = (request: Request): Promise<Response> => {
		const task = fetchRequest(request);
		pending.add(task);
		void task.then(
			() => pending.delete(task),
			() => pending.delete(task)
		);
		return task;
	};
	options.plugins ??= [];
	// Vite's dev server only ever runs over plain HTTP/1, so the HTTP/2 branch of srvx's
	// NodeHttpHandler union is unreachable here; narrow to keep Connect's HandleFunction happy.
	const nodeHandler = toNodeHandler(fetch) as (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
	// configureServer runs before createServer resolves.
	options.plugins.push({
		name: 'stars:fetch-server',
		configureServer(server) {
			vite = server;
			return () => {
				server.middlewares.use((req, res, next) => {
					void Promise.resolve(nodeHandler(req, res)).catch(next);
				});
			};
		}
	});
	vite = await viteModule.createServer(options);
	return {
		vite,
		fetch,
		async listen(port) {
			if (closed) throw new Error('The server is closed.');
			await vite.listen(port);
		},
		close() {
			closed = true;
			closing ??= (async () => {
				await Promise.allSettled(pending);
				await vite.close();
			})();
			return closing;
		}
	};
}
