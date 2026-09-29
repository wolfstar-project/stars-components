import { container, type InteractionHandler } from '@wolfstar/http-framework';
import { MessageFlags, type APIInteractionResponseCallbackData } from 'discord-api-types/v10';
import { cancelCleanup, refreshCleanup } from '../cleanup.js';
import { decodeCustomIdContent } from '../custom-id.js';
import { describeRestError } from '../errors.js';
import { disableMessageComponents, expireInteraction } from '../expire.js';
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

type UpdateBody = Pick<APIInteractionResponseCallbackData, 'content' | 'embeds' | 'allowed_mentions' | 'components'>;

/**
 * Where a click's responses go. A click handled at once answers directly: one `update` (or an ephemeral `reply`), with
 * anything else as a `followup`. A click that had to wait for a previous click on the same session was acknowledged
 * with `deferUpdate` before waiting, so its message is edited through the deferred response (`PATCH @original`) and
 * every notice is an ephemeral `followup`.
 */
interface Responder {
	/**
	 * Whether the click's response was already sent by a custom action, so the handler must not send another one.
	 * Always `false` for a deferred click: the handler owns the edit of the deferred response.
	 */
	readonly answered: boolean;
	/**
	 * Whether the click was acknowledged with `deferUpdate`: its edits are separate requests that can fail, so a new
	 * page is shown before it is saved.
	 */
	readonly deferred: boolean;
	/**
	 * @returns Whether the message was edited. A direct response throws instead of returning `false`.
	 */
	update(body: UpdateBody): Promise<boolean>;
	notify(content: string, failure: string): Promise<void>;
}

async function followupNotice(interaction: ComponentInteraction, content: string, failure: string): Promise<void> {
	try {
		const result = await interaction.followup({ content, flags: MessageFlags.Ephemeral });
		if (result.isErr()) container.logger.error(`[http-framework-utilities] ${failure}`, describeRestError(result.unwrapErr()));
	} catch (error) {
		container.logger.error(`[http-framework-utilities] ${failure}`, describeRestError(error));
	}
}

function directResponder(interaction: ComponentInteraction): Responder {
	return {
		get answered() {
			return interaction.replied;
		},
		deferred: false,
		async update(body) {
			await interaction.update(body);
			return true;
		},
		async notify(content, failure) {
			if (interaction.replied) return followupNotice(interaction, content, failure);
			await interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}
	};
}

type Deferred = Awaited<ReturnType<ComponentInteraction['deferUpdate']>>;

function deferredResponder(interaction: ComponentInteraction, message: Deferred): Responder {
	return {
		answered: false,
		deferred: true,
		async update(body) {
			try {
				const result = await message.update(body);
				if (result.isOk()) return true;
				container.logger.error('[http-framework-utilities] Failed to update a paginated message', describeRestError(result.unwrapErr()));
			} catch (error) {
				container.logger.error('[http-framework-utilities] Failed to update a paginated message', describeRestError(error));
			}

			return false;
		},
		notify: (content, failure) => followupNotice(interaction, content, failure)
	};
}

/**
 * Acknowledges a click that has to wait for a previous one, so it does not miss Discord's 3-second response deadline.
 * @returns The deferred response, or `null` when the acknowledgement failed (logged).
 */
async function acknowledge(interaction: ComponentInteraction): Promise<Deferred | null> {
	try {
		return await interaction.deferUpdate();
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to acknowledge a paginated message click', describeRestError(error));
		return null;
	}
}

/**
 * Disables the clicked message's components, then sends `content` as an ephemeral notice.
 */
async function expire(interaction: ComponentInteraction, responder: Responder, content: string): Promise<void> {
	if (!responder.answered) await responder.update({ components: disableMessageComponents(interaction.message.components) });
	await responder.notify(content, 'Failed to send an expiry notice');
}

/**
 * Handles a click on a paginated message component (`wolfstar-pm.<sessionId>.<action>`).
 */
export async function handlePaginatedMessageInteraction(interaction: InteractionHandler.Interaction, customIdValue: unknown): Promise<void> {
	if (!isComponentInteraction(interaction)) return;

	const decoded = decodeCustomIdContent(customIdValue);
	if (decoded === null) return expireInteraction(interaction, getDefaultExpiredReply());

	const { sessionId, action } = decoded;
	if (!queues.has(sessionId)) return serialize(sessionId, () => handle(interaction, directResponder(interaction), sessionId, action));

	// Another click on this session is still being handled: acknowledge now, answer through the deferred response later.
	const acknowledged = acknowledge(interaction);
	return serialize(sessionId, async () => {
		const message = await acknowledged;
		if (message !== null) await handle(interaction, deferredResponder(interaction, message), sessionId, action);
	});
}

async function handle(interaction: ComponentInteraction, responder: Responder, sessionId: string, action: string): Promise<void> {
	const runtimes = getPaginatedMessageRuntime();
	const loadedRuntime = runtimes.get(sessionId);
	// The runtime entry is the only way this process knows about a per-instance store, so it is always read for it.
	const runtimeStore = loadedRuntime === null ? null : (loadedRuntime.store ?? getSessionStore());

	const loaded = await load(sessionId, runtimeStore);
	if (loaded === null) return expire(interaction, responder, getDefaultExpiredReply());

	const { session, store } = loaded;
	// A shared store is visible to every replica; a runtime entry only ever describes this process, so it must not
	// be trusted for custom actions or lazy page resolution once the store says the session can be handled anywhere,
	// nor when the session was found in another store than the runtime's.
	const runtime = store.scope === 'shared' || store !== runtimeStore ? null : loadedRuntime;

	if (session.ownerId !== null && interaction.user.id !== session.ownerId) {
		return responder.notify(session.wrongUserReply, 'Failed to send a wrong user notice');
	}

	let index = session.index;
	let stopped = false;

	const builtin = applyBuiltinAction(session, action, getSelectedValues(interaction));
	if (builtin) {
		({ index, stopped } = builtin);
	} else {
		const custom = runtime?.actions.get(action);
		if (custom === undefined || custom.type !== 'button' || custom.run === undefined) {
			return expire(interaction, responder, session.expiredReply);
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
		if (!responder.answered) await responder.update({ components: renderComponents(sessionId, session, { disabled: true }) });
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
		if (runtime === null) return expire(interaction, responder, session.expiredReply);
		page = await runtime.resolvePage(index);
	}

	// Stopped (or expired) while this click was handled, e.g. by another replica: saving would bring it back.
	const latest = await read(store, sessionId);
	if (latest.ok && (latest.value === null || isStoppedSession(latest.value))) {
		if (responder.answered) return;
		return expire(interaction, responder, getDefaultExpiredReply());
	}

	const now = Date.now();
	const expiresAt = Math.min(now + session.idle, session.maximumExpiresAt ?? Number.POSITIVE_INFINITY);
	const ttl = Math.max(expiresAt - now, 1);
	const next: PaginatedMessageSession = { ...session, index, pages: session.pages.map((entry, i) => (i === index ? page : entry)), expiresAt };
	const components = renderComponents(sessionId, next);
	next.components = components;

	// A deferred click edits the message in a separate request: show the page first, and only save it once shown, so a
	// failed edit cannot leave the store a page ahead of the message.
	if (responder.deferred && !(await responder.update({ ...page, components }))) {
		return responder.notify(getDefaultSaveFailedReply(), 'Failed to send a save failure notice');
	}

	try {
		await store.set(sessionId, next, ttl);
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to save a paginated message session', describeRestError(error));
		// Keep (or, for a deferred click, restore) the stored page: showing the new one would desync the message from the
		// store.
		if (!responder.answered) {
			await responder.update({ ...session.pages[session.index], components: session.components ?? renderComponents(sessionId, session) });
		}

		return responder.notify(getDefaultSaveFailedReply(), 'Failed to send a save failure notice');
	}

	// Only the process that ran the message holds a cleanup record; other replicas are picked up by its recheck.
	refreshCleanup(sessionId, expiresAt, components);
	if (loadedRuntime !== null) runtimes.set(sessionId, loadedRuntime, ttl);
	if (responder.answered || responder.deferred) return;

	await responder.update({ ...page, components });
}
