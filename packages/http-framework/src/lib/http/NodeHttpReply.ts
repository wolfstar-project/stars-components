import type { ServerResponse } from 'node:http';
import type { HttpReply } from './HttpReply.js';

/**
 * {@link HttpReply} backed by a Node.js {@link ServerResponse}.
 * Preserves the observable behavior of the existing `Client.listen()` path.
 */
export class NodeHttpReply implements HttpReply {
	readonly #response: ServerResponse;

	public constructor(response: ServerResponse) {
		this.#response = response;
	}

	public get replied() {
		return this.#response.writableEnded;
	}

	public get closed() {
		return this.#response.closed;
	}

	public status(code: number): this {
		this.#response.statusCode = code;
		return this;
	}

	public header(name: string, value: string): this {
		this.#response.setHeader(name, value);
		return this;
	}

	public end(body?: string): this {
		this.#response.end(body);
		return this;
	}

	public flushed(): Promise<void> {
		if (this.#response.closed) return Promise.resolve();
		return new Promise((resolve) => {
			this.#response.on('close', () => resolve());
		});
	}
}
