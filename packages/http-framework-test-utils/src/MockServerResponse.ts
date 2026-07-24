import type { HttpReply } from '@wolfstar/http-framework';

/**
 * In-memory {@link HttpReply} for tests.
 */
export class MockHttpReply implements HttpReply {
	public statusCode = 200;
	public readonly headers: Record<string, string> = {};
	#replied = false;
	readonly #chunks: string[] = [];
	#flushResolve: (() => void) | null = null;
	readonly #flushed: Promise<void>;

	public constructor() {
		this.#flushed = new Promise((resolve) => {
			this.#flushResolve = resolve;
		});
	}

	public get replied() {
		return this.#replied;
	}

	public get closed() {
		return this.#replied;
	}

	public status(code: number): this {
		this.statusCode = code;
		return this;
	}

	public header(name: string, value: string): this {
		this.headers[name.toLowerCase()] = value;
		return this;
	}

	public end(body?: string): this {
		if (this.#replied) return this;
		this.#replied = true;
		if (body !== undefined) this.#chunks.push(body);
		this.#flushResolve?.();
		this.#flushResolve = null;
		return this;
	}

	public flushed(): Promise<void> {
		return this.#flushed;
	}

	public getBody(): string {
		return this.#chunks.join('');
	}

	public getBodyAsJson<T = unknown>(): T {
		return JSON.parse(this.getBody()) as T;
	}

	public reset() {
		this.#chunks.length = 0;
		this.statusCode = 200;
		this.#replied = false;
		Object.keys(this.headers).forEach((key) => delete this.headers[key]);
	}
}

/**
 * @deprecated Use {@link MockHttpReply} instead.
 */
export class MockServerResponse extends MockHttpReply {}

export function makeResponse(): MockHttpReply {
	return new MockHttpReply();
}
