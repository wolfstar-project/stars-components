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

const registered = new Set<SessionStore>();

/**
 * Registers a store the paginated message handler also looks sessions up in, after the default store. A paginated
 * message given its own shared `store` is only known to the process that ran it; register that store on every replica
 * (or make it the default with {@linkcode setSessionStore}) so the others can handle its clicks too. Registering a
 * store twice is a no-op.
 */
export function registerSessionStore(value: SessionStore): void {
	registered.add(value);
}

/**
 * The stores registered with {@linkcode registerSessionStore}, in registration order.
 * @internal
 */
export function getRegisteredSessionStores(): Set<SessionStore> {
	return registered;
}
