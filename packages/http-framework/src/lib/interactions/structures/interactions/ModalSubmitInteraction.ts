import { container } from '@sapphire/pieces';
import { ModalInteractionOptionResolver } from '@wolfstar/discord-utilities';
import { InteractionResponseType, Routes, type APIModalSubmitInteraction, type RESTPostAPIInteractionFollowupResult } from 'discord-api-types/v10';
import type { AsyncDiscordResult } from '../../utils/util-types.js';
import { resultFromDiscord } from '../../utils/util.js';
import { Message, PartialMessage } from '../Message.js';
import { Data } from '../common/symbols.js';
import { BaseInteraction } from './base/BaseInteraction.js';
import type {
	DeferResponseData,
	DeferResponseOptions,
	DeferUpdateResult,
	FollowupOptions,
	MessageResponseData,
	MessageResponseOptions,
	UpdateData,
	UpdateOptions
} from './base/common.js';

export class ModalSubmitInteraction extends BaseInteraction<ModalSubmitInteraction.Type> {
	private _fields: ModalInteractionOptionResolver | undefined;

	/**
	 * Typed access to the submitted fields, found by the custom ID of their component.
	 *
	 * It reads text inputs, string, user, role, channel and mentionable selects, the members behind a user select, and
	 * uploaded files, whether they sit in an action row or in a label. Other components, such as radio and checkbox
	 * groups, are only reachable through `fields.get(customId)`, which returns the raw component. The resolver is built
	 * on first access and reused after that.
	 *
	 * @example
	 * ```typescript
	 * const reason = interaction.fields.getTextInput('reason');
	 * const roles = interaction.fields.getSelectedRoles('roles');
	 * ```
	 *
	 * @remarks The getters throw when the component is missing or of another type, and the select getters throw a
	 * `TypeError` when the payload has no `resolved` data (or no `members`, in a DM), as the resolver in
	 * `@wolfstar/discord-utilities` does.
	 * @seealso {@link ModalSubmitInteraction.data} for the raw data.
	 */
	public get fields(): ModalInteractionOptionResolver {
		return (this._fields ??= new ModalInteractionOptionResolver(this[Data]));
	}

	/**
	 * The message the interaction was attached to, if any.
	 */
	public get message() {
		return this[Data].message;
	}

	/**
	 * ACK a button interaction and update it to a loading state.
	 */
	public async deferUpdate(): Promise<PartialMessage<this>> {
		const body: DeferUpdateResult = { type: InteractionResponseType.DeferredMessageUpdate };
		await this._sendReply(body);
		return new PartialMessage(this);
	}

	/**
	 * ACK an interaction and edit a response later. The user sees a loading state.
	 * @param data The data to be sent, if any.
	 */
	public async update(data?: UpdateOptions): Promise<PartialMessage<this>> {
		const body: UpdateData = { type: InteractionResponseType.UpdateMessage, data };
		await this._sendReply(body);
		return new PartialMessage(this);
	}

	/**
	 * Responds to the interaction with a message.
	 * @param data The data to be sent.
	 */
	public async reply(data: MessageResponseOptions): Promise<PartialMessage<this>> {
		const body: MessageResponseData = { type: InteractionResponseType.ChannelMessageWithSource, data };
		await this._sendReply(body);
		return new PartialMessage(this);
	}

	/**
	 * ACK an interaction and edit a response later. The user sees a loading state.
	 * @param data The data to be sent, if any.
	 */
	public async defer(data?: DeferResponseOptions): Promise<PartialMessage<this>> {
		const body: DeferResponseData = { type: InteractionResponseType.DeferredChannelMessageWithSource, data };
		await this._sendReply(body);
		return new PartialMessage(this);
	}

	/**
	 * Sends a follow-up message.
	 * @param data The data to be sent.
	 */
	public async followup({ files, ...body }: FollowupOptions): AsyncDiscordResult<Message<this>> {
		const result = await resultFromDiscord(
			container.rest.post(Routes.webhook(this.applicationId, this.token), {
				body,
				files,
				auth: false
			}) as Promise<RESTPostAPIInteractionFollowupResult>
		);

		return result.map((message) => new Message(this, message));
	}
}

export namespace ModalSubmitInteraction {
	export type Type = APIModalSubmitInteraction;
}
