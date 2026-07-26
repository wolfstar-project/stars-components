import type { Client } from '../../lib/Client.js';
import { createHandler, type CreateHandlerOptions } from '../fetch/index.js';

/**
 * Minimal Bun.serve surface used by this adapter.
 *
 * Intentionally does **not** import `bun` / `@types/bun`: those typings augment
 * `NodeJS.ProcessEnv` and break typechecking of other packages in this monorepo.
 */
interface BunServer {
	readonly hostname: string | null;
	readonly port: number | null;
	stop(closeActiveConnections?: boolean): void | Promise<void>;
}

interface BunServeBaseOptions {
	fetch(request: Request): Response | Promise<Response>;
	development?: boolean;
	maxRequestBodySize?: number;
	error?: (error: Error) => Response | Promise<Response> | undefined | Promise<undefined>;
}

interface BunHostnamePortServeOptions extends BunServeBaseOptions {
	port?: number;
	hostname?: string;
	unix?: never;
}

interface BunUnixServeOptions extends BunServeBaseOptions {
	unix: string;
	port?: never;
	hostname?: never;
}

type BunServeOptions = BunHostnamePortServeOptions | BunUnixServeOptions;

interface BunRuntime {
	serve(options: BunServeOptions): BunServer;
}

function getBun(): BunRuntime {
	const bun = (globalThis as typeof globalThis & { Bun?: BunRuntime }).Bun;
	if (!bun?.serve) {
		throw new Error('[@wolfstar/http-framework/adapters/bun] Bun.serve is not available. Run this adapter under the Bun runtime.');
	}
	return bun;
}

export type Server = BunServer;

/**
 * Options for {@link createServer}. Combines Bun.serve options with Fetch handler options
 * (`postPath`, `key`). The `fetch` handler is provided by the adapter and must not be set.
 */
export type CreateServerOptions = CreateHandlerOptions & (Omit<BunHostnamePortServeOptions, 'fetch'> | Omit<BunUnixServeOptions, 'fetch'>);

/**
 * Creates a Bun HTTP server for the {@link Client} using {@link Bun.serve}.
 *
 * This is a thin convenience wrapper around {@link createHandler}. The Node
 * `Client.listen()` path is unchanged and does not use this adapter.
 *
 * @example
 * ```ts
 * import { Client } from '@wolfstar/http-framework';
 * import { createServer } from '@wolfstar/http-framework/adapters/bun';
 *
 * const client = new Client({ ... });
 * await client.load();
 *
 * createServer(client, { port: 3000, postPath: '/interactions' });
 * ```
 */
export function createServer(client: Client, options: CreateServerOptions): Server {
	const { postPath, key, ...serveOptions } = options;
	const handler = createHandler(client, { postPath, key });
	const Bun = getBun();

	if ('unix' in serveOptions && serveOptions.unix !== undefined) {
		return Bun.serve({
			...serveOptions,
			fetch: (request) => handler(request, {})
		});
	}

	return Bun.serve({
		...serveOptions,
		fetch: (request) => handler(request, {})
	});
}
