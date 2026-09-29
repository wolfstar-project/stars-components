export type Awaitable<T> = T | PromiseLike<T>;

/**
 * `'process'`: values stay in this process (functions allowed). `'shared'`: JSON only, visible to every replica.
 */
export type SessionStoreScope = 'process' | 'shared';

/**
 * Where interactive messages keep their state between clicks. Values must be JSON-serializable for stores other than
 * {@linkcode MemorySessionStore}.
 */
export interface SessionStore<T = unknown> {
	readonly scope: SessionStoreScope;
	get(id: string): Awaitable<T | null>;
	/**
	 * @param ttl Time-to-live in milliseconds, refreshed on every write.
	 */
	set(id: string, value: T, ttl: number): Awaitable<void>;
	delete(id: string): Awaitable<void>;
}
