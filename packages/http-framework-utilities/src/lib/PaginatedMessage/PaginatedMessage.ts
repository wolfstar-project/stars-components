import { container } from '@wolfstar/http-framework';
import { ButtonStyle, MessageFlags, type APIEmbed, type APIInteractionResponseCallbackData } from 'discord-api-types/v10';
import {
	InteractionTokenLifetime,
	MaximumTokenLifetime,
	scheduleCleanup,
	updateCleanupComponents,
	type CleanupTarget,
	type TimeoutBehavior
} from '../cleanup.js';
import { createSessionId } from '../custom-id.js';
import { describeRestError } from '../errors.js';
import { DefaultExpiredReply, DefaultWrongUserReply, type RunnableInteraction } from '../interactions.js';
import { MessageBuilder, validateMessage } from '../MessageBuilder.js';
import { registerUtilityHandlers } from '../registration.js';
import { getSessionStore } from '../sessions/config.js';
import type { SessionStore } from '../sessions/SessionStore.js';
import { assertSharedSessionState } from '../sessions/validate.js';
import { renderComponents } from './render.js';
import { getPaginatedMessageRuntime } from './runtime.js';
import type {
	PaginatedMessageAction,
	PaginatedMessagePage,
	PaginatedMessagePageResolvable,
	PaginatedMessageSelectActionData,
	PaginatedMessageSession
} from './types.js';

export type PaginatedMessageActionEntry = PaginatedMessageAction | PaginatedMessageSelectActionData;

export interface PaginatedMessageOptions {
	pages?: PaginatedMessagePageResolvable[];
	/**
	 * @default PaginatedMessage.defaultActions
	 */
	actions?: PaginatedMessageActionEntry[];
	/**
	 * @default PaginatedMessage.defaultIdle
	 */
	idle?: number;
	/**
	 * Whether only the user who started the paginated message can use it.
	 * @default true
	 */
	ownerOnly?: boolean;
	wrongUserReply?: string;
	/**
	 * The ephemeral notice sent when a click arrives for an expired or unknown session.
	 * @default DefaultExpiredReply
	 */
	expiredReply?: string;
	/**
	 * What {@linkcode PaginatedMessage.run} does to the controls when the session times out.
	 * @default 'disable'
	 */
	timeoutBehavior?: TimeoutBehavior;
	/**
	 * @default getSessionStore()
	 */
	store?: SessionStore;
}

interface PreparedSession {
	sessionId: string;
	session: PaginatedMessageSession;
	payload: APIInteractionResponseCallbackData;
	store: SessionStore;
	shared: boolean;
}

export interface PaginatedMessageStart {
	sessionId: string;
	payload: APIInteractionResponseCallbackData;
}

function validateIdle(idle: number): number {
	if (!Number.isInteger(idle) || idle <= 0) {
		throw new RangeError(`idle must be a positive integer, received ${idle}`);
	}

	return idle;
}

function toPage(value: PaginatedMessagePage | MessageBuilder): PaginatedMessagePage {
	const { content, embeds, allowed_mentions } = value instanceof MessageBuilder ? value.toJSON() : value;
	const page: PaginatedMessagePage = {};
	if (content !== undefined) page.content = content;
	if (embeds !== undefined) page.embeds = embeds;
	if (allowed_mentions !== undefined) page.allowed_mentions = allowed_mentions;
	validateMessage(page);
	return page;
}

/**
 * A message whose pages are browsed with buttons and a page select, over HTTP interactions.
 */
export class PaginatedMessage {
	public static defaultActions: PaginatedMessageActionEntry[] = [
		{ id: 'first', type: 'button', style: ButtonStyle.Primary, emoji: { name: '⏪' } },
		{ id: 'previous', type: 'button', style: ButtonStyle.Primary, emoji: { name: '◀️' } },
		{ id: 'next', type: 'button', style: ButtonStyle.Primary, emoji: { name: '▶️' } },
		{ id: 'last', type: 'button', style: ButtonStyle.Primary, emoji: { name: '⏩' } },
		{ id: 'stop', type: 'button', style: ButtonStyle.Danger, emoji: { name: '⏹️' } },
		{ id: 'select', type: 'select', placeholder: 'Go to page…' }
	];

	public static defaultIdle = 5 * 60_000;

	public pages: PaginatedMessagePageResolvable[] = [];
	public actions = new Map<string, PaginatedMessageActionEntry>();
	public index = 0;
	public idle: number;
	public ownerOnly: boolean;
	public wrongUserReply: string;
	public expiredReply: string;
	public timeoutBehavior: TimeoutBehavior;
	public store: SessionStore | undefined;

	/**
	 * Whether function pages are resolved when the message starts (`true`) or when first displayed (`false`).
	 */
	protected eager = true;

	readonly #resolved = new Map<number, PaginatedMessagePage>();

	public constructor(options: PaginatedMessageOptions = {}) {
		this.idle = validateIdle(options.idle ?? PaginatedMessage.defaultIdle);
		this.ownerOnly = options.ownerOnly ?? true;
		this.wrongUserReply = options.wrongUserReply ?? DefaultWrongUserReply;
		this.expiredReply = options.expiredReply ?? DefaultExpiredReply;
		this.timeoutBehavior = options.timeoutBehavior ?? 'disable';
		this.store = options.store;
		if (options.pages) this.addPages(options.pages);
		this.addActions(options.actions ?? PaginatedMessage.defaultActions);
	}

	public addPage(page: PaginatedMessagePageResolvable): this {
		this.pages.push(page);
		return this;
	}

	public addPages(pages: readonly PaginatedMessagePageResolvable[]): this {
		for (const page of pages) this.addPage(page);
		return this;
	}

	public addPageContent(content: string): this {
		return this.addPage({ content });
	}

	public addPageEmbed(embed: APIEmbed): this {
		return this.addPage({ embeds: [embed] });
	}

	public addPageBuilder(builder: MessageBuilder | ((builder: MessageBuilder) => MessageBuilder)): this {
		return this.addPage(typeof builder === 'function' ? builder(new MessageBuilder()) : builder);
	}

	public setActions(actions: readonly PaginatedMessageActionEntry[]): this {
		this.actions.clear();
		return this.addActions(actions);
	}

	public addAction(action: PaginatedMessageActionEntry): this {
		if (action.id.length === 0 || action.id.includes('.')) {
			throw new TypeError(`Invalid action id "${action.id}": it must be non-empty and must not contain "."`);
		}

		if (action.type === 'button' && !action.label && !action.emoji) {
			throw new TypeError(`Invalid button action "${action.id}": it must have a label or an emoji`);
		}

		this.actions.set(action.id, action);
		return this;
	}

	public addActions(actions: readonly PaginatedMessageActionEntry[]): this {
		for (const action of actions) this.addAction(action);
		return this;
	}

	public setIndex(index: number): this {
		this.index = index;
		return this;
	}

	public setIdle(idle: number): this {
		this.idle = validateIdle(idle);
		return this;
	}

	public setOwnerOnly(ownerOnly: boolean): this {
		this.ownerOnly = ownerOnly;
		return this;
	}

	public setWrongUserInteractionReply(reply: string): this {
		this.wrongUserReply = reply;
		return this;
	}

	public setExpiredReply(reply: string): this {
		this.expiredReply = reply;
		return this;
	}

	public setTimeoutBehavior(behavior: TimeoutBehavior): this {
		this.timeoutBehavior = behavior;
		return this;
	}

	/**
	 * Resolves a page, calling its function the first time for function pages.
	 * @internal Used by the interaction handler for lazy pages.
	 */
	public async resolvePage(index: number): Promise<PaginatedMessagePage> {
		const cached = this.#resolved.get(index);
		if (cached) return cached;

		const page = this.pages[index];
		if (page === undefined) throw new RangeError(`There is no page at index ${index}`);

		const resolved = toPage(typeof page === 'function' ? await page() : page);
		this.#resolved.set(index, resolved);
		return resolved;
	}

	/**
	 * Resets the page list and any already-resolved pages. Subclasses that rebuild their pages from scratch (e.g. a
	 * `make()` method) should call this instead of resetting {@linkcode pages} directly, so stale resolved pages
	 * from a previous build are not served by {@linkcode resolvePage}.
	 */
	protected clearPages(): this {
		this.pages = [];
		this.#resolved.clear();
		return this;
	}

	/**
	 * Creates the session and returns the first payload, for flows that send it themselves (deferred replies,
	 * follow-ups).
	 * @param ownerId The user allowed to use the components; ignored when {@linkcode ownerOnly} is `false`. Passing
	 * `null` lets anyone use the components even when {@linkcode ownerOnly} is `true`.
	 */
	public async start(ownerId: string | null): Promise<PaginatedMessageStart> {
		const prepared = await this.#prepare(ownerId);
		await this.#save(prepared, this.idle);
		return { sessionId: prepared.sessionId, payload: prepared.payload };
	}

	/**
	 * Replies to the interaction with the first page and schedules the timeout cleanup of the reply.
	 * @returns The session id.
	 * @throws {RangeError} When {@linkcode idle} exceeds {@linkcode MaximumTokenLifetime} and the reply can only be
	 * edited with the interaction token (ephemeral, or no channel), before replying.
	 */
	public async run(interaction: RunnableInteraction): Promise<string> {
		const createdAt = Date.now();
		const prepared = await this.#prepare(interaction.user.id);
		const { sessionId, session, payload, store } = prepared;

		const ephemeral = ((payload.flags ?? 0) & MessageFlags.Ephemeral) !== 0;
		const channelId = interaction.channel?.id ?? null;
		const longLived = this.idle > MaximumTokenLifetime;
		if (longLived && (ephemeral || channelId === null)) {
			throw new RangeError(
				`idle must be at most ${MaximumTokenLifetime} ms (MaximumTokenLifetime) for ${ephemeral ? 'an ephemeral reply' : 'a reply without a channel'}, received ${this.idle}`
			);
		}

		const target: CleanupTarget = { messageId: '@original', channelId, ephemeral };
		// The message is only editable with the token until it expires, unless the real id is fetched below.
		session.maximumExpiresAt = longLived ? null : createdAt + MaximumTokenLifetime;
		session.expiresAt = Math.min(createdAt + this.idle, session.maximumExpiresAt ?? Number.POSITIVE_INFINITY);
		session.cleanupTarget = target;
		session.components = payload.components as PaginatedMessageSession['components'];
		await this.#save(prepared, session.expiresAt - createdAt);

		const response = await interaction.reply(payload);
		if (longLived) {
			target.messageId = await fetchMessageId(response, sessionId);
			if (target.messageId === '@original') {
				// Without the real id the token is the only edit credential again: cap the lifetime like a short session.
				session.maximumExpiresAt = createdAt + MaximumTokenLifetime;
				session.expiresAt = Math.min(session.expiresAt, session.maximumExpiresAt);
			}

			try {
				await store.set(sessionId, { ...session, cleanupTarget: target }, Math.max(session.expiresAt - Date.now(), 1));
			} catch (error) {
				container.logger.error('[http-framework-utilities] Failed to save a paginated message session', describeRestError(error));
			}
		}

		const credentials =
			interaction.applicationId && interaction.token
				? { applicationId: interaction.applicationId, token: interaction.token, tokenExpiresAt: createdAt + InteractionTokenLifetime }
				: null;

		scheduleCleanup(sessionId, {
			target: { ...target },
			credentials,
			components: session.components!,
			behavior: this.timeoutBehavior,
			deadline: session.expiresAt,
			recheck: async () => {
				const current = (await store.get(sessionId)) as PaginatedMessageSession | null;
				if (current === null) return null;
				if (current.components) updateCleanupComponents(sessionId, current.components);
				return current.expiresAt !== undefined && current.expiresAt > Date.now() ? current.expiresAt : null;
			}
		});

		return sessionId;
	}

	async #prepare(ownerId: string | null): Promise<PreparedSession> {
		if (this.pages.length === 0) throw new Error('PaginatedMessage has no pages');
		if (!Number.isInteger(this.index) || this.index < 0 || this.index >= this.pages.length) {
			throw new RangeError(`The index ${this.index} is outside of the ${this.pages.length} pages`);
		}

		await registerUtilityHandlers();

		const store = this.store ?? getSessionStore();
		const shared = store.scope === 'shared';

		if (shared) {
			for (const [index, page] of this.pages.entries()) {
				if (typeof page === 'function') throw new TypeError(`pages[${index}] is a lazy page function; shared stores need eager pages`);
			}

			for (const [id, action] of this.actions) {
				if (action.type === 'button' && action.run !== undefined) {
					throw new TypeError(`actions.${id}.run is a callback; shared stores support built-in actions only`);
				}
			}
		}

		const pages: (PaginatedMessagePage | null)[] = await Promise.all(
			this.pages.map((page, index) =>
				index === this.index || this.eager || typeof page !== 'function' ? this.resolvePage(index) : Promise.resolve(null)
			)
		);

		const session: PaginatedMessageSession = {
			ownerId: this.ownerOnly ? ownerId : null,
			index: this.index,
			pages,
			actions: [...this.actions.values()].map((action) => {
				if (action.type === 'select') return action;
				const { run: _run, ...data } = action;
				return data;
			}),
			idle: this.idle,
			wrongUserReply: this.wrongUserReply,
			expiredReply: this.expiredReply
		};

		if (shared) assertSharedSessionState(session);

		const sessionId = createSessionId();
		return { sessionId, session, payload: { ...pages[this.index]!, components: renderComponents(sessionId, session) }, store, shared };
	}

	async #save({ sessionId, session, store, shared }: PreparedSession, ttl: number): Promise<void> {
		await store.set(sessionId, session, ttl);
		if (!shared) getPaginatedMessageRuntime().set(sessionId, this, ttl);
	}
}

interface MessageResult {
	isOk(): boolean;
	unwrap(): { id: string };
	unwrapErr(): unknown;
}

/**
 * Fetches the real id of a reply through the `PartialMessage#get()` it resolved with, falling back to `'@original'`.
 */
async function fetchMessageId(response: unknown, sessionId: string): Promise<string> {
	const get = (response as { get?: unknown } | null | undefined)?.get;
	if (typeof get !== 'function') return '@original';

	try {
		const result = (await get.call(response)) as MessageResult;
		if (result.isOk()) return result.unwrap().id;
		container.logger.error('[http-framework-utilities] Failed to fetch a paginated message', {
			sessionId,
			error: describeRestError(result.unwrapErr())
		});
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to fetch a paginated message', { sessionId, error: describeRestError(error) });
	}

	return '@original';
}
