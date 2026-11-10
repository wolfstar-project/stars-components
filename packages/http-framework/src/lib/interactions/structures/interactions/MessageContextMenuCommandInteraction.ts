import type { APIMessage, APIMessageApplicationCommandInteraction, Snowflake } from 'discord-api-types/v10';
import { transformMessageInteraction } from '../../resolvers/InteractionOptions.js';
import { CommandInteraction } from './base/CommandInteraction.js';

export class MessageContextMenuCommandInteraction extends CommandInteraction<MessageContextMenuCommandInteraction.Type> {
	/**
	 * The ID of the message the command was used on.
	 */
	public get targetId(): Snowflake {
		return this.data.target_id;
	}

	/**
	 * The message the command was used on.
	 */
	public get targetMessage(): APIMessage {
		return transformMessageInteraction(this.data).message;
	}
}

export namespace MessageContextMenuCommandInteraction {
	export type Type = APIMessageApplicationCommandInteraction;
}
