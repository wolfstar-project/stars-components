import { PaginatedMessage } from './PaginatedMessage.js';

/**
 * A {@linkcode PaginatedMessage} resolving function pages only when first displayed. Lazy pages are process-local:
 * a click reaching another process shows them as expired.
 */
export class LazyPaginatedMessage extends PaginatedMessage {
	protected override eager = false;
}
