import type { Client, HandleWebRequestOptions } from '../../lib/Client.js';

/**
 * Optional context passed alongside a Fetch request (e.g. Cloudflare Workers `waitUntil` / `env`).
 */
export interface AdapterContext {
	waitUntil?(promise: Promise<unknown>): void;
	env?: unknown;
}

/**
 * A Web Fetch–compatible request handler.
 */
export type Handler = (req: Request, ctx?: AdapterContext) => Promise<Response>;

export interface CreateHandlerOptions extends HandleWebRequestOptions {}

/**
 * Creates a universal Fetch handler for a {@link Client}.
 *
 * Mount this on Fastify, Nitro, Hono, Cloudflare Workers, Bun, Deno, or any
 * runtime that speaks `(Request) => Response`. The Node `Client.listen()` path
 * is unchanged and does not go through this adapter.
 *
 * @example Workers
 * ```ts
 * const handler = createHandler(client, { postPath: '/interactions' });
 * export default { fetch: handler };
 * ```
 *
 * @example Nitro
 * ```ts
 * const handler = createHandler(client, { postPath: '/interactions' });
 * export default defineEventHandler((event) => handler(toWebRequest(event)));
 * ```
 */
export function createHandler(client: Client, options: CreateHandlerOptions = {}): Handler {
	return (req, _ctx) => client.handleWebRequest(req, options);
}
