import { StringDecoder } from 'node:string_decoder';
import type { DevService } from '../lib/dev-service.js';
import { classifyAppLine, type LogLevel } from '../lib/log-buffer.js';

/** Capture third-party writes before build plugins run. Ink writes through a separate, unpatched sink. */
export function captureOutput(service: DevService, stream: NodeJS.WriteStream, fallback: LogLevel): () => void {
	const original = stream.write;
	const decoder = new StringDecoder('utf8');
	let pending = '';
	const emit = (text: string) => {
		if (text.trim()) service.log('build', classifyAppLine(text, fallback), text);
	};
	const write: typeof stream.write = (chunk: unknown, encoding?: unknown, callback?: unknown) => {
		pending += typeof chunk === 'string' ? chunk : chunk instanceof Uint8Array ? decoder.write(Buffer.from(chunk)) : String(chunk);
		const lines = pending.split(/\r?\n/);
		pending = lines.pop() ?? '';
		for (const line of lines) emit(line);
		// A tool without newlines must not grow the capture indefinitely.
		if (pending.length > 65536) {
			emit(pending);
			pending = '';
		}
		const done = typeof encoding === 'function' ? encoding : callback;
		if (typeof done === 'function') queueMicrotask(() => done());
		return true;
	};
	stream.write = write;
	return () => {
		if (stream.write === write) stream.write = original;
		emit(pending + decoder.end());
		pending = '';
	};
}
