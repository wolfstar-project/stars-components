import type { SessionStore } from './SessionStore.js';

export interface MemorySessionStoreOptions {
	/**
	 * How often expired entries are removed, in milliseconds. `0` disables the sweep; entries still expire on read.
	 * @default 60_000
	 */
	sweepInterval?: number;
}

/**
 * A process-local {@linkcode SessionStore}. Sessions do not survive a restart and are not shared between processes.
 */
export class MemorySessionStore<T = unknown> implements SessionStore<T> {
	readonly #entries = new Map<string, { value: T; expiresAt: number }>();
	#sweeper: ReturnType<typeof setInterval> | null = null;

	public constructor(options: MemorySessionStoreOptions = {}) {
		const interval = options.sweepInterval ?? 60_000;
		if (interval > 0) {
			this.#sweeper = setInterval(() => this.sweep(), interval);
			this.#sweeper.unref?.();
		}
	}

	public get size(): number {
		return this.#entries.size;
	}

	public get(id: string): T | null {
		const entry = this.#entries.get(id);
		if (entry === undefined) return null;
		if (entry.expiresAt <= Date.now()) {
			this.#entries.delete(id);
			return null;
		}

		return entry.value;
	}

	public set(id: string, value: T, ttl: number): void {
		this.#entries.set(id, { value, expiresAt: Date.now() + ttl });
	}

	public delete(id: string): void {
		this.#entries.delete(id);
	}

	/**
	 * Removes every expired entry.
	 * @returns The number of removed entries.
	 */
	public sweep(): number {
		const now = Date.now();
		let removed = 0;
		for (const [id, entry] of this.#entries) {
			if (entry.expiresAt > now) continue;
			this.#entries.delete(id);
			removed++;
		}

		return removed;
	}

	/**
	 * Stops the sweep timer and drops every entry.
	 */
	public destroy(): void {
		if (this.#sweeper !== null) clearInterval(this.#sweeper);
		this.#sweeper = null;
		this.#entries.clear();
	}
}
