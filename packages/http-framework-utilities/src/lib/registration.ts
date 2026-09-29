import { container } from '@wolfstar/http-framework';
import { MessagePrompterHandlerName, PaginatedMessageHandlerName } from './custom-id.js';
import { MessagePrompterHandler } from './handlers/MessagePrompterHandler.js';
import { PaginatedMessageHandler } from './handlers/PaginatedMessageHandler.js';

let registration: Promise<void> | null = null;

/**
 * Adds the `wolfstar-pm` and `wolfstar-mp` interaction handlers to the `interaction-handlers` store. Safe to call
 * repeatedly and before the client loads its pieces (the registration is then queued by `@sapphire/pieces`).
 */
export function registerUtilityHandlers(): Promise<void> {
	// `piece` is cast to `never`: the repo-wide typecheck program type-checks `@wolfstar/http-framework`'s own `src`
	// (via the root tsconfig's `packages/` glob) alongside the `dist/*.d.ts` this package imports from, so `loadPiece`'s
	// generic constraint and our handler classes (built against the `dist` types) resolve to two structurally
	// distinct `InteractionHandler` identities. Both identities are the same class at runtime (Node resolves
	// `@wolfstar/http-framework` once), as covered by `tests/registration.test.ts`.
	registration ??= Promise.all([
		container.stores.loadPiece({ store: 'interaction-handlers', name: PaginatedMessageHandlerName, piece: PaginatedMessageHandler as never }),
		container.stores.loadPiece({ store: 'interaction-handlers', name: MessagePrompterHandlerName, piece: MessagePrompterHandler as never })
	]).then(
		() => undefined,
		(error: unknown) => {
			registration = null;
			throw error;
		}
	);

	return registration;
}
