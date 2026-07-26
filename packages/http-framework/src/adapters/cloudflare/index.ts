import type { Client } from '../../lib/Client.js';
import { createHandler, type AdapterContext, type CreateHandlerOptions } from '../fetch/index.js';

/**
 * Minimal Cloudflare Workers {@link ExecutionContext} surface used by this adapter.
 *
 * Avoids depending on `@cloudflare/workers-types` so the monorepo typecheck is not
 * coupled to Workers globals.
 */
export interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

/**
 * Module export shape compatible with Cloudflare Workers `ExportedHandler`.
 */
export interface CloudflareExport<Env = unknown> {
	fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
}

export type CreateExportOptions = CreateHandlerOptions;

/**
 * Creates a Cloudflare Workers module export for the {@link Client}.
 *
 * Wraps {@link createHandler} and forwards Workers `env` / `waitUntil` into the
 * Fetch {@link AdapterContext}. The Node `Client.listen()` path is unchanged.
 *
 * @example
 * ```ts
 * import { Client } from '@wolfstar/http-framework';
 * import { createExport } from '@wolfstar/http-framework/adapters/cloudflare';
 *
 * const client = new Client({ ... });
 * await client.load();
 *
 * export default createExport(client, { postPath: '/interactions' });
 * ```
 */
export function createExport<Env = unknown>(client: Client, options: CreateExportOptions = {}): CloudflareExport<Env> {
	const handler = createHandler(client, options);

	return {
		fetch(request, env, ctx) {
			const adapterContext: AdapterContext = {
				env,
				waitUntil: (promise) => ctx.waitUntil(promise)
			};
			return handler(request, adapterContext);
		}
	};
}
