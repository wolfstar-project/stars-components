import { container, type InteractionHandler } from '@wolfstar/http-framework';
import { MessageFlags } from 'discord-api-types/v10';
import { decodeCustomIdContent } from '../custom-id.js';
import { getSelectedValues, isComponentInteraction, type ComponentInteraction } from '../interactions.js';
import { getSessionStore } from '../sessions/config.js';
import type { SessionStore } from '../sessions/SessionStore.js';
import { renderComponents } from './render.js';
import { getPaginatedMessageRuntime } from './runtime.js';
import { applyBuiltinAction } from './state.js';
import type { PaginatedMessagePage, PaginatedMessageSession } from './types.js';

async function expire(interaction: ComponentInteraction): Promise<void> {
	await interaction.update({ components: [] });
}

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
	if (decoded === null) return expire(interaction);

	const { sessionId, action } = decoded;
	const runtimes = getPaginatedMessageRuntime();
	const loadedRuntime = runtimes.get(sessionId);
	const store = loadedRuntime?.store ?? getSessionStore();
	// A shared store is visible to every replica; a runtime entry only ever describes this process, so it must not
	// be trusted for custom actions or lazy page resolution once the store says the session can be handled anywhere.
	const runtime = store.scope === 'shared' ? null : loadedRuntime;

	const session = await load(store, sessionId);
	if (session === null) return expire(interaction);

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
		if (custom === undefined || custom.type !== 'button' || custom.run === undefined) return expire(interaction);

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
		if (runtime === null) return expire(interaction);
		page = await runtime.resolvePage(index);
	}

	const next: PaginatedMessageSession = { ...session, index, pages: session.pages.map((entry, i) => (i === index ? page : entry)) };
	try {
		await store.set(sessionId, next, session.idle);
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to save a paginated message session', error);
	}

	if (runtime !== null) runtimes.set(sessionId, runtime, session.idle);
	if (interaction.replied) return;

	await interaction.update({ ...page, components: renderComponents(sessionId, next) });
}
