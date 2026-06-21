import type { ServerResponse } from 'node:http';
import { Writable } from 'node:stream';

export class MockServerResponse extends Writable {
	public statusCode = 200;
	public readonly headers: Record<string, string> = {};
	readonly #chunks: Buffer[] = [];

	public setHeader(name: string, value: string | number | readonly string[]) {
		this.headers[name.toLowerCase()] = String(value);
	}

	public override _write(chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
		this.#chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
		callback();
	}

	public getBody(): string {
		return Buffer.concat(this.#chunks).toString('utf8');
	}

	public getBodyAsJson<T = unknown>(): T {
		return JSON.parse(this.getBody()) as T;
	}

	public reset() {
		this.#chunks.length = 0;
		this.statusCode = 200;
		Object.keys(this.headers).forEach(key => delete this.headers[key]);
	}
}

export function makeResponse(): ServerResponse {
	return new MockServerResponse() as unknown as ServerResponse;
}
