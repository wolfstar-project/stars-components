import { EventEmitter } from 'node:events';
import { stripVTControlCharacters } from 'node:util';

export type LogSource = 'stars' | 'build' | 'app' | 'tsc' | 'tunnel';
export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

export interface LogEntry {
	readonly id: number;
	readonly time: number;
	readonly source: LogSource;
	readonly level: LogLevel;
	readonly text: string;
}

export interface LogFilter {
	source?: LogSource | null;
	level?: LogLevel | null;
	query?: string | null;
}

export type LogInput = Omit<LogEntry, 'id' | 'time'>;

/**
 * A bounded, in-memory log store shared by the dev service and its renderers.
 */
export class LogBuffer extends EventEmitter<{ entry: [LogEntry]; clear: [] }> {
	#entries: LogEntry[] = [];
	#nextId = 1;

	public constructor(public readonly capacity = 2000) {
		super();
	}

	public push(input: LogInput): LogEntry {
		const entry: LogEntry = { id: this.#nextId++, time: Date.now(), ...input };
		this.#entries.push(entry);
		if (this.#entries.length > this.capacity) this.#entries.splice(0, this.#entries.length - this.capacity);
		this.emit('entry', entry);
		return entry;
	}

	public entries(): readonly LogEntry[] {
		return this.#entries;
	}

	public filter(filter: LogFilter): LogEntry[] {
		const query = filter.query?.toLowerCase() ?? null;
		return this.#entries.filter(
			(entry) =>
				(!filter.source || entry.source === filter.source) &&
				(!filter.level || matchesLevel(entry.level, filter.level)) &&
				(!query || entry.text.toLowerCase().includes(query))
		);
	}

	public clear(): void {
		this.#entries = [];
		this.emit('clear');
	}
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, success: 1, warn: 2, error: 3 };

/**
 * Whether `level` is at least as severe as `minimum`.
 */
export function matchesLevel(level: LogLevel, minimum: LogLevel): boolean {
	return LEVEL_ORDER[level] >= LEVEL_ORDER[minimum];
}

/**
 * Whether an application stderr line only continues the preceding JavaScript error. Stack frames and the fields
 * Node prints after an `Error` are useful log lines, but they must not each increment the panel's error counter.
 */
export function isErrorDetail(entry: Pick<LogEntry, 'source' | 'level' | 'text'>): boolean {
	if (entry.source !== 'app' || entry.level !== 'error') return false;
	const text = stripVTControlCharacters(entry.text);
	return /^\s+at\s/.test(text) || /^\s+(?:type|path|code|cause|errno|syscall|address|port):/.test(text) || /^\s*}\s*$/.test(text) || !text.trim();
}

/** stderr is a transport, not a severity: Node and many loggers also send warnings there. */
export function classifyAppLine(text: string, fallback: LogLevel): LogLevel {
	const plain = stripVTControlCharacters(text);
	if (/\b(?:Error|ERROR|FATAL)\b|\bERR_[A-Z_]+\b/.test(plain)) return 'error';
	if (/\b(?:Warning|WARN|WARNING|DeprecationWarning|ExperimentalWarning)\b/.test(plain) || /^\(node:\d+\).*warning/i.test(plain)) return 'warn';
	if (/^\s*(?:\(Use .*--trace-warnings|\[(?:info|debug)\]|INFO\b|DEBUG\b|[◇ℹ✔])/.test(plain)) return 'info';
	return fallback;
}
