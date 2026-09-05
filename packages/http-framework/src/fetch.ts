/**
 * Fetch (Web `Request`/`Response`) entry point for `@wolfstar/http-framework`, so a bot can be served by anything
 * that speaks Fetch — Vite's dev middleware, Nitro, Cloudflare Workers, `Bun.serve`, `Deno.serve` — instead of only
 * `Client#listen()`'s own `node:http` server.
 *
 * @module @wolfstar/http-framework/fetch
 */
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { Client } from './lib/Client.js';
import { makeKey, type Key } from './lib/utils/security.js';

export interface FetchHandlerOptions {
	/**
	 * The bot's Discord public key, used to verify interaction signatures.
	 * @default process.env.DISCORD_PUBLIC_KEY
	 */
	discordPublicKey?: string;
	/**
	 * The path interactions are posted to.
	 * @default process.env.HTTP_POST_PATH ?? '/'
	 */
	postPath?: string;
}

export type FetchHandler = (request: Request) => Promise<Response>;

type Dispatch = (request: IncomingMessage, response: ServerResponse, path: string, key: Key) => Promise<ServerResponse>;

/**
 * Wraps `Client`'s own dispatch — signature verification, routing, replies, the exact same code `listen()` runs —
 * behind a Fetch handler, by bridging a `Request` to the `IncomingMessage`/`ServerResponse` shape it expects.
 *
 * This changes nothing about the framework's internals: `handleRawHttpMessage` is `protected`, not private, and is
 * called here exactly as `Client#listen()` calls it on every request. `Client` never has to know which transport
 * (`node:http`, Vite, Nitro, a Worker) produced the request.
 */
export async function createFetchHandler(client: Client, options: FetchHandlerOptions = {}): Promise<FetchHandler> {
	const discordPublicKey = options.discordPublicKey ?? process.env.DISCORD_PUBLIC_KEY;
	if (!discordPublicKey) throw new Error('The discordPublicKey cannot be empty');

	const key = await makeKey(discordPublicKey);
	const path = options.postPath ?? process.env.HTTP_POST_PATH ?? '/';
	const dispatch = (client as unknown as { handleRawHttpMessage: Dispatch }).handleRawHttpMessage.bind(client);

	return async (request: Request): Promise<Response> => {
		const incoming = toIncomingMessage(request);
		const outgoing = new FetchServerResponse();
		await dispatch(incoming, outgoing as unknown as ServerResponse, path, key);
		return outgoing.toResponse();
	};
}

function toIncomingMessage(request: Request): IncomingMessage {
	const headers: IncomingHttpHeaders = {};
	request.headers.forEach((value, name) => {
		headers[name] = value;
	});

	const body = request.body ? Readable.fromWeb(request.body as never) : Readable.from([]);
	return Object.assign(body, { url: new URL(request.url).pathname, method: request.method, headers }) as unknown as IncomingMessage;
}

/**
 * The minimum of `http.ServerResponse` `Client`'s dispatch touches: `setHeader`, `statusCode`, `end`,
 * `writableEnded`, and a `'close'` event once the response is done (`BaseInteraction`'s `_sendReply` awaits it
 * before resolving, so a caller here has to fire it too, or every reply would hang forever).
 */
class FetchServerResponse extends EventEmitter {
	public statusCode = 200;
	public writableEnded = false;
	public closed = false;
	readonly #headers = new Headers();
	#body: string | undefined;

	public setHeader(name: string, value: string): void {
		this.#headers.set(name, value);
	}

	public end(chunk?: string): this {
		this.#body = chunk;
		this.writableEnded = true;
		this.closed = true;
		queueMicrotask(() => this.emit('close'));
		return this;
	}

	public toResponse(): Response {
		return new Response(this.#body ?? null, { status: this.statusCode, headers: this.#headers });
	}
}
