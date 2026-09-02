import { EventEmitter } from 'node:events';

export type LogSource = 'stars' | 'build' | 'app';
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
