import { createWriteStream, mkdirSync, type WriteStream } from 'node:fs';
import { dirname } from 'node:path';
import type { LogBuffer, LogEntry } from './log-buffer.js';

/**
 * Mirrors a dev session's logs into a file, so a run can be read back after the terminal UI is gone (the TUI takes
 * over the alternate screen and its scrollback disappears on exit). Seedcord keeps a `logs/` directory for the same
 * reason; this writes a single, truncated-per-run file instead.
 */
export class LogFileWriter {
	#stream: WriteStream | null = null;

	public constructor(
		public readonly file: string,
		private readonly logs: LogBuffer
	) {}

	public open(): void {
		if (this.#stream) return;

		mkdirSync(dirname(this.file), { recursive: true });
		this.#stream = createWriteStream(this.file, { flags: 'w' });
		// A broken pipe or a read-only directory must never take the dev session down with it.
		this.#stream.on('error', () => this.close());

		for (const entry of this.logs.entries()) this.#write(entry);
		this.logs.on('entry', this.#write);
	}

	public close(): void {
		const stream = this.#stream;
		this.#stream = null;
		if (!stream) return;

		this.logs.off('entry', this.#write);
		stream.end();
	}

	#write = (entry: LogEntry): void => {
		this.#stream?.write(`${format(entry)}\n`);
	};
}

function format(entry: LogEntry): string {
	return `${new Date(entry.time).toISOString()} ${entry.level.padEnd(7)} ${entry.source.padEnd(6)} ${entry.text}`;
}
