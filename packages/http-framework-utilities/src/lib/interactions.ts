import type { InteractionHandler, Interactions } from '@wolfstar/http-framework';
import { ComponentType, type APIInteractionResponseCallbackData } from 'discord-api-types/v10';

export const DefaultWrongUserReply = 'These buttons are not for you.';

export const DefaultExpiredReply = 'This interaction has expired.';

let defaultExpiredReply = DefaultExpiredReply;

/**
 * Sets the process-wide expiry notice, sent as an ephemeral followup when a click arrives for a session that cannot be
 * read anymore (expired, unknown, or undecodable): the paginated message and prompter handlers have no per-instance
 * setting to read in that case. It is also the default `expiredReply` of paginated messages created afterwards.
 * @param reply The notice; {@linkcode DefaultExpiredReply} restores the built-in one.
 */
export function setDefaultExpiredReply(reply: string): void {
	defaultExpiredReply = reply;
}

/**
 * The process-wide expiry notice, {@linkcode DefaultExpiredReply} unless changed with
 * {@linkcode setDefaultExpiredReply}.
 */
export function getDefaultExpiredReply(): string {
	return defaultExpiredReply;
}

export const DefaultSaveFailedReply = 'Something went wrong, please try again.';

let defaultSaveFailedReply = DefaultSaveFailedReply;

/**
 * Sets the process-wide notice sent as an ephemeral followup when a paginated message click cannot be saved to its
 * session store: the message keeps showing the page it was on, and the user is asked to try again.
 * @param reply The notice; {@linkcode DefaultSaveFailedReply} restores the built-in one.
 */
export function setDefaultSaveFailedReply(reply: string): void {
	defaultSaveFailedReply = reply;
}

/**
 * The process-wide save-failed notice, {@linkcode DefaultSaveFailedReply} unless changed with
 * {@linkcode setDefaultSaveFailedReply}.
 */
export function getDefaultSaveFailedReply(): string {
	return defaultSaveFailedReply;
}

/**
 * Anything an interactive message can be sent from: command and component interactions of `@wolfstar/http-framework`.
 */
export interface RunnableInteraction {
	readonly user: { readonly id: string };
	/**
	 * With {@linkcode token}, used to edit the response when it times out. Without either, timeout cleanup is skipped.
	 */
	readonly applicationId?: string;
	/**
	 * The interaction token. Kept in process memory only, never stored in a session store or logged.
	 */
	readonly token?: string;
	readonly channel?: { readonly id: string } | undefined;
	/**
	 * `@wolfstar/http-framework` resolves a `PartialMessage` whose `get()` fetches the real message.
	 */
	reply(data: APIInteractionResponseCallbackData): Promise<unknown>;
}

export type ComponentInteraction = Interactions.MessageComponentButton | Interactions.MessageComponentStringSelect;

export function isComponentInteraction(interaction: InteractionHandler.Interaction): interaction is ComponentInteraction {
	const type = (interaction.data as { component_type?: ComponentType }).component_type;
	return type === ComponentType.Button || type === ComponentType.StringSelect;
}

export function getSelectedValues(interaction: ComponentInteraction): string[] {
	return interaction.data.component_type === ComponentType.StringSelect ? interaction.data.values : [];
}
