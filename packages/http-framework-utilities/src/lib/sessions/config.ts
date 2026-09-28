import { MemorySessionStore } from './MemorySessionStore.js';
import type { SessionStore } from './SessionStore.js';

let store: SessionStore | null = null;

/**
 * The store used by interactive messages that were not given their own. Defaults to a {@linkcode MemorySessionStore}.
 */
export function getSessionStore(): SessionStore {
	return (store ??= new MemorySessionStore());
}

/**
 * Sets the default store, e.g. a {@linkcode RedisSessionStore} for bots running several processes.
 */
export function setSessionStore(value: SessionStore): void {
	store = value;
}
