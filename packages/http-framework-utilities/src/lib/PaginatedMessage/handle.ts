import { container, type InteractionHandler } from '@wolfstar/http-framework';
import { MessageFlags } from 'discord-api-types/v10';
import { cancelCleanup, refreshCleanup } from '../cleanup.js';
import { decodeCustomIdContent } from '../custom-id.js';
import { expireInteraction } from '../expire.js';
import { getDefaultExpiredReply, getSelectedValues, isComponentInteraction } from '../interactions.js';
import { getSessionStore } from '../sessions/config.js';
import type { SessionStore } from '../sessions/SessionStore.js';
import { renderComponents } from './render.js';
import { getPaginatedMessageRuntime } from './runtime.js';
import { applyBuiltinAction } from './state.js';
import type { PaginatedMessagePage, PaginatedMessageSession } from './types.js';

async function load(store: SessionStore, sessionId: string): Promise<PaginatedMessageSession | null> {
	try {
		return ((await store.get(sessionId)) as PaginatedMessageSession | null) ?? null;
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to read a paginated message session', error);
		return null;
	}
}

/**
 * Handles a click on a paginated message component (`wolfstar-pm.<sessionId>.<action>`).
 */
export async function handlePaginatedMessageInteraction(interaction: InteractionHandler.Interaction, customIdValue: unknown): Promise<void> {
	if (!isComponentInteraction(interaction)) return;

	const decoded = decodeCustomIdContent(customIdValue);
	if (decoded === null) return expireInteraction(interaction, getDefaultExpiredReply());

	const { sessionId, action } = decoded;
	const runtimes = getPaginatedMessageRuntime();
	const loadedRuntime = runtimes.get(sessionId);
	// The runtime entry is the only way this process knows about a per-instance store, so it is always read for it.
	const store = loadedRuntime?.store ?? getSessionStore();
	// A shared store is visible to every replica; a runtime entry only ever describes this process, so it must not
	// be trusted for custom actions or lazy page resolution once the store says the session can be handled anywhere.
	const runtime = store.scope === 'shared' ? null : loadedRuntime;

	const session = await load(store, sessionId);
	if (session === null) return expireInteraction(interaction, getDefaultExpiredReply());

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
		try {
			await store.delete(sessionId);
		} catch (error) {
			container.logger.error('[http-framework-utilities] Failed to delete a paginated message session', error);
		}

		return;
	}

	let page: PaginatedMessagePage | null = session.pages[index] ?? null;
	if (page === null) {
		if (runtime === null) return expireInteraction(interaction, session.expiredReply);
		page = await runtime.resolvePage(index);
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
		container.logger.error('[http-framework-utilities] Failed to save a paginated message session', error);
	}

	// Only the process that ran the message holds a cleanup record; other replicas are picked up by its recheck.
	refreshCleanup(sessionId, expiresAt, components);
	if (loadedRuntime !== null) runtimes.set(sessionId, loadedRuntime, ttl);
	if (interaction.replied) return;

	await interaction.update({ ...page, components });
}
