import type { HttpReply } from './HttpReply.js';

/**
 * {@link HttpReply} that materializes a Web {@link Response} when {@link HttpReply.end} is called.
 * Used by the Fetch adapter so frameworks (Fastify, Nitro, Workers, …) can mount a single handler.
 */
export class FetchHttpReply implements HttpReply {
	#statusCode = 200;
	readonly #headers = new Headers({ 'Content-Type': 'application/json' });
	#replied = false;
	#resolve!: (response: Response) => void;
	readonly #response: Promise<Response>;

	public constructor() {
		this.#response = new Promise<Response>((resolve) => {
			this.#resolve = resolve;
		});
	}

	public get replied() {
		return this.#replied;
	}

	public get closed() {
		return this.#replied;
	}

	/**
	 * The Web {@link Response} produced after {@link HttpReply.end}.
	 */
	public get response(): Promise<Response> {
		return this.#response;
	}

	public status(code: number): this {
		this.#statusCode = code;
		return this;
	}

	public header(name: string, value: string): this {
		this.#headers.set(name, value);
		return this;
	}

	public end(body?: string): this {
		if (this.#replied) return this;
		this.#replied = true;
		this.#resolve(new Response(body ?? null, { status: this.#statusCode, headers: this.#headers }));
		return this;
	}

	public flushed(): Promise<void> {
		return this.#response.then(() => undefined);
	}
}
