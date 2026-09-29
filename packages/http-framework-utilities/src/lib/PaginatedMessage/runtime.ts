import { MemorySessionStore } from '../sessions/MemorySessionStore.js';
import type { PaginatedMessage } from './PaginatedMessage.js';

let runtime: MemorySessionStore<PaginatedMessage> | null = null;

/**
 * The paginated messages started by this process, by session id. They hold what cannot be stored as JSON: lazy page
 * resolvers and custom action callbacks. Entries expire with their session's idle time.
 * @internal
 */
export function getPaginatedMessageRuntime(): MemorySessionStore<PaginatedMessage> {
	return (runtime ??= new MemorySessionStore<PaginatedMessage>());
}
