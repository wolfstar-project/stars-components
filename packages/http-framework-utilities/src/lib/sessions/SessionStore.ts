export type Awaitable<T> = T | PromiseLike<T>;

/**
 * Where interactive messages keep their state between clicks. Values must be JSON-serializable for stores other than
 * {@linkcode MemorySessionStore}.
 */
export interface SessionStore<T = unknown> {
	get(id: string): Awaitable<T | null>;
	/**
	 * @param ttl Time-to-live in milliseconds, refreshed on every write.
	 */
	set(id: string, value: T, ttl: number): Awaitable<void>;
	delete(id: string): Awaitable<void>;
}
