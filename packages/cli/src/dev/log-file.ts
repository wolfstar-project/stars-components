import { createWriteStream, mkdirSync, readdirSync, rmSync, type WriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import type { LogBuffer, LogEntry } from '../utils/log-buffer.js';

/**
 * Mirrors a dev session's logs into a file, so a run can be read back after the terminal UI is gone (the TUI takes
 * over the alternate screen and its scrollback disappears on exit). `dev.logFile` is a single file truncated on every
 * run; `dev.logs.dir` adds one file per run (see {@link runLogFile}).
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
		this.#stream?.write(`${formatLogLine(entry)}\n`);
	};
}

/** One line per entry, then its detail lines indented under it. Never filtered: the file is the whole session. */
export function formatLogLine(entry: LogEntry): string {
	const head = `${new Date(entry.time).toISOString()} ${entry.level.padEnd(7)} ${entry.channel.padEnd(12)} ${stripVTControlCharacters(entry.text)}`;
	return [head, ...(entry.detail ?? []).map((line) => `  ${stripVTControlCharacters(line)}`)].join('\n');
}

const RUN_FILE = /^dev-.+\.log$/;

/**
 * The file of this run inside `dev.logs.dir` (`dev-<timestamp>.log`), after deleting the oldest ones so the directory
 * holds at most `keep` files with the new one. The names sort by time, so no file needs to be opened to order them.
 */
export function runLogFile(directory: string, keep: number, now: Date = new Date()): string {
	let existing: string[] = [];
	try {
		existing = readdirSync(directory)
			.filter((name) => RUN_FILE.test(name))
			.sort();
	} catch {
		// The directory does not exist yet: nothing to prune.
	}

	for (const name of existing.slice(0, Math.max(0, existing.length - Math.max(0, keep - 1)))) {
		rmSync(join(directory, name), { force: true });
	}

	return join(directory, `dev-${now.toISOString().replaceAll(':', '-')}.log`);
}
