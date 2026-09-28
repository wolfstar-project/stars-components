import { ButtonStyle, type APIEmbed, type APIInteractionResponseCallbackData } from 'discord-api-types/v10';
import { createSessionId } from '../custom-id.js';
import { DefaultWrongUserReply, type RunnableInteraction } from '../interactions.js';
import { MessageBuilder, validateMessage } from '../MessageBuilder.js';
import { registerUtilityHandlers } from '../registration.js';
import { getSessionStore } from '../sessions/config.js';
import type { SessionStore } from '../sessions/SessionStore.js';
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
	 * @default getSessionStore()
	 */
	store?: SessionStore;
}

export interface PaginatedMessageStart {
	sessionId: string;
	payload: APIInteractionResponseCallbackData;
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
	public store: SessionStore | undefined;

	/**
	 * Whether function pages are resolved when the message starts (`true`) or when first displayed (`false`).
	 */
	protected eager = true;

	readonly #resolved = new Map<number, PaginatedMessagePage>();

	public constructor(options: PaginatedMessageOptions = {}) {
		this.idle = options.idle ?? PaginatedMessage.defaultIdle;
		this.ownerOnly = options.ownerOnly ?? true;
		this.wrongUserReply = options.wrongUserReply ?? DefaultWrongUserReply;
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
		this.idle = idle;
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
		if (this.pages.length === 0) throw new Error('PaginatedMessage has no pages');
		if (!Number.isInteger(this.index) || this.index < 0 || this.index >= this.pages.length) {
			throw new RangeError(`The index ${this.index} is outside of the ${this.pages.length} pages`);
		}

		await registerUtilityHandlers();

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
			wrongUserReply: this.wrongUserReply
		};

		const sessionId = createSessionId();
		await (this.store ?? getSessionStore()).set(sessionId, session, this.idle);
		getPaginatedMessageRuntime().set(sessionId, this, this.idle);

		return { sessionId, payload: { ...pages[this.index]!, components: renderComponents(sessionId, session) } };
	}

	/**
	 * Replies to the interaction with the first page.
	 * @returns The session id.
	 */
	public async run(interaction: RunnableInteraction): Promise<string> {
		const { sessionId, payload } = await this.start(interaction.user.id);
		await interaction.reply(payload);
		return sessionId;
	}
}
