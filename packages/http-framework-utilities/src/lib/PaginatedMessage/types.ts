import type { APIInteractionResponseCallbackData, APIMessageComponentEmoji, ButtonStyle } from 'discord-api-types/v10';
import type { ComponentInteraction } from '../interactions.js';
import type { MessageBuilder } from '../MessageBuilder.js';
import type { Awaitable } from '../sessions/SessionStore.js';

export type PaginatedMessagePage = Pick<APIInteractionResponseCallbackData, 'content' | 'embeds' | 'allowed_mentions'>;

export type PaginatedMessagePageResolvable = PaginatedMessagePage | MessageBuilder | (() => Awaitable<PaginatedMessagePage | MessageBuilder>);

export type PaginatedMessageBuiltinActionId = 'first' | 'previous' | 'next' | 'last' | 'stop' | 'select';

export interface PaginatedMessageButtonActionData {
	/**
	 * The action's id, part of the button's `custom_id`. Must not contain `.`.
	 */
	id: string;
	type: 'button';
	style?: ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger;
	label?: string;
	emoji?: APIMessageComponentEmoji;
}

export interface PaginatedMessageSelectActionData {
	id: 'select';
	type: 'select';
	placeholder?: string;
}

export type PaginatedMessageActionData = PaginatedMessageButtonActionData | PaginatedMessageSelectActionData;

/**
 * The JSON-serializable state of a paginated message, kept in a `SessionStore` between clicks.
 */
export interface PaginatedMessageSession {
	/**
	 * The only user allowed to use the components, `null` when anyone can.
	 */
	ownerId: string | null;
	index: number;
	/**
	 * The resolved pages, `null` for lazy pages not displayed yet.
	 */
	pages: (PaginatedMessagePage | null)[];
	actions: PaginatedMessageActionData[];
	/**
	 * How long the session lives without interactions, in milliseconds.
	 */
	idle: number;
	wrongUserReply: string;
	expiredReply: string;
}

export interface PaginatedMessageActionContext {
	readonly interaction: ComponentInteraction;
	readonly session: Readonly<PaginatedMessageSession>;
	setIndex(index: number): void;
	stop(): void;
}

/**
 * A button action. Actions with `run` only work on the process that started the paginated message.
 */
export interface PaginatedMessageAction extends PaginatedMessageButtonActionData {
	run?(context: PaginatedMessageActionContext): Awaitable<void>;
}
