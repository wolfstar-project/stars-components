/**
 * Bridges a Web `Request`/`Response` to the `IncomingMessage`/`ServerResponse` shape `Client#handleRawHttpMessage`
 * expects, so `Client#fetch` can run the exact same signature verification, routing and replies `listen()`'s
 * `node:http` server does, behind a Fetch handler instead of a bound port.
 */
import type { IncomingHttpHeaders, IncomingMessage } from 'node:http';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

export function toIncomingMessage(request: Request): IncomingMessage {
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
export class FetchServerResponse extends EventEmitter {
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
