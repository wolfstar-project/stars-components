import { container, type InteractionHandler } from '@wolfstar/http-framework';
import { MessageFlags } from 'discord-api-types/v10';
import { cancelCleanup, refreshCleanup } from '../cleanup.js';
import { decodeCustomIdContent } from '../custom-id.js';
import { describeRestError } from '../errors.js';
import { expireInteraction } from '../expire.js';
import {
	getDefaultExpiredReply,
	getDefaultSaveFailedReply,
	getSelectedValues,
	isComponentInteraction,
	type ComponentInteraction
} from '../interactions.js';
import { getRegisteredSessionStores, getSessionStore } from '../sessions/config.js';
import type { SessionStore } from '../sessions/SessionStore.js';
import { renderComponents } from './render.js';
import { getPaginatedMessageRuntime } from './runtime.js';
import { applyBuiltinAction, isStoppedSession, type StoppedPaginatedMessageSession } from './state.js';
import type { PaginatedMessagePage, PaginatedMessageSession } from './types.js';

async function read(store: SessionStore, sessionId: string): Promise<{ ok: true; value: unknown } | { ok: false }> {
	try {
		return { ok: true, value: (await store.get(sessionId)) ?? null };
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to read a paginated message session', describeRestError(error));
		return { ok: false };
	}
}

/**
 * Looks the session up in the store of the process that ran the message (when this is it), then in the default
 * store, then in every registered store. A store that fails to read is logged and skipped.
 * @returns The session and the store it was found in, or `null` when no store has it (or it was stopped).
 */
async function load(sessionId: string, runtimeStore: SessionStore | null): Promise<{ session: PaginatedMessageSession; store: SessionStore } | null> {
	const stores = new Set<SessionStore>();
	if (runtimeStore !== null) stores.add(runtimeStore);
	stores.add(getSessionStore());
	for (const store of getRegisteredSessionStores()) stores.add(store);

	for (const store of stores) {
		const result = await read(store, sessionId);
		if (!result.ok || result.value === null) continue;
		if (isStoppedSession(result.value)) return null;
		return { session: result.value as PaginatedMessageSession, store };
	}

	return null;
}

// The clicks being handled in this process, by session id: each one waits for the previous click on the same session,
// so two clicks never both start from the same stored index.
const queues = new Map<string, Promise<void>>();

function serialize(sessionId: string, task: () => Promise<void>): Promise<void> {
	const previous = queues.get(sessionId) ?? Promise.resolve();
	const current = previous.then(task);
	const tail = current.catch(() => undefined);
	queues.set(sessionId, tail);
	void tail.then(() => {
		if (queues.get(sessionId) === tail) queues.delete(sessionId);
	});
	return current;
}

/**
 * Answers a click whose new state could not be saved: the message keeps the stored page (showing the new one would
 * desync it from the store), then an ephemeral followup asks the user to try again.
 */
async function keepCurrentPage(interaction: ComponentInteraction, sessionId: string, session: PaginatedMessageSession): Promise<void> {
	if (!interaction.replied) {
		await interaction.update({
			...session.pages[session.index],
			components: session.components ?? renderComponents(sessionId, session)
		});
	}

	try {
		const result = await interaction.followup({ content: getDefaultSaveFailedReply(), flags: MessageFlags.Ephemeral });
		if (result.isErr()) {
			container.logger.error('[http-framework-utilities] Failed to send a save failure notice', describeRestError(result.unwrapErr()));
		}
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to send a save failure notice', describeRestError(error));
	}
}

/**
 * Handles a click on a paginated message component (`wolfstar-pm.<sessionId>.<action>`).
 */
export async function handlePaginatedMessageInteraction(interaction: InteractionHandler.Interaction, customIdValue: unknown): Promise<void> {
	if (!isComponentInteraction(interaction)) return;

	const decoded = decodeCustomIdContent(customIdValue);
	if (decoded === null) return expireInteraction(interaction, getDefaultExpiredReply());

	return serialize(decoded.sessionId, () => handle(interaction, decoded.sessionId, decoded.action));
}

async function handle(interaction: ComponentInteraction, sessionId: string, action: string): Promise<void> {
	const runtimes = getPaginatedMessageRuntime();
	const loadedRuntime = runtimes.get(sessionId);
	// The runtime entry is the only way this process knows about a per-instance store, so it is always read for it.
	const runtimeStore = loadedRuntime === null ? null : (loadedRuntime.store ?? getSessionStore());

	const loaded = await load(sessionId, runtimeStore);
	if (loaded === null) return expireInteraction(interaction, getDefaultExpiredReply());

	const { session, store } = loaded;
	// A shared store is visible to every replica; a runtime entry only ever describes this process, so it must not
	// be trusted for custom actions or lazy page resolution once the store says the session can be handled anywhere,
	// nor when the session was found in another store than the runtime's.
	const runtime = store.scope === 'shared' || store !== runtimeStore ? null : loadedRuntime;

	if (session.ownerId !== null && interaction.user.id !== session.ownerId) {
		await interaction.reply({ content: session.wrongUserReply, flags: MessageFlags.Ephemeral });
		return;
	}

	let index = session.index;
	let stopped = false;

	const builtin = applyBuiltinAction(session, action, getSelectedValues(interaction));
	if (builtin) {
		({ index, stopped } = builtin);
	} else {
		const custom = runtime?.actions.get(action);
		if (custom === undefined || custom.type !== 'button' || custom.run === undefined) {
			return expireInteraction(interaction, session.expiredReply);
		}

		await custom.run({
			interaction,
			session,
			setIndex(value) {
				if (Number.isInteger(value) && value >= 0 && value < session.pages.length) index = value;
			},
			stop() {
				stopped = true;
			}
		});
	}

	if (stopped) {
		if (!interaction.replied) await interaction.update({ components: renderComponents(sessionId, session, { disabled: true }) });
		cancelCleanup(sessionId);
		runtimes.delete(sessionId);
		// A tombstone, not a delete: a click that loaded the session before the stop must not save it back afterwards.
		const now = Date.now();
		const ttl = Math.max((session.expiresAt ?? now + session.idle) - now, 1);
		try {
			await store.set(sessionId, { stopped: true } satisfies StoppedPaginatedMessageSession, ttl);
		} catch (error) {
			container.logger.error('[http-framework-utilities] Failed to stop a paginated message session', describeRestError(error));
		}

		return;
	}

	let page: PaginatedMessagePage | null = session.pages[index] ?? null;
	if (page === null) {
		if (runtime === null) return expireInteraction(interaction, session.expiredReply);
		page = await runtime.resolvePage(index);
	}

	// Stopped (or expired) while this click was handled, e.g. by another replica: saving would bring it back.
	const latest = await read(store, sessionId);
	if (latest.ok && (latest.value === null || isStoppedSession(latest.value))) {
		if (interaction.replied) return;
		return expireInteraction(interaction, getDefaultExpiredReply());
	}

	const now = Date.now();
	const expiresAt = Math.min(now + session.idle, session.maximumExpiresAt ?? Number.POSITIVE_INFINITY);
	const ttl = Math.max(expiresAt - now, 1);
	const next: PaginatedMessageSession = { ...session, index, pages: session.pages.map((entry, i) => (i === index ? page : entry)), expiresAt };
	const components = renderComponents(sessionId, next);
	next.components = components;
	try {
		await store.set(sessionId, next, ttl);
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to save a paginated message session', describeRestError(error));
		return keepCurrentPage(interaction, sessionId, session);
	}

	// Only the process that ran the message holds a cleanup record; other replicas are picked up by its recheck.
	refreshCleanup(sessionId, expiresAt, components);
	if (loadedRuntime !== null) runtimes.set(sessionId, loadedRuntime, ttl);
	if (interaction.replied) return;

	await interaction.update({ ...page, components });
}
