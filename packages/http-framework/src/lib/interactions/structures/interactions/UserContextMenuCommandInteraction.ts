import type { APIInteractionDataResolvedGuildMember, APIUser, APIUserApplicationCommandInteraction, Snowflake } from 'discord-api-types/v10';
import { transformUserInteraction } from '../../resolvers/InteractionOptions.js';
import { CommandInteraction } from './base/CommandInteraction.js';

export class UserContextMenuCommandInteraction extends CommandInteraction<UserContextMenuCommandInteraction.Type> {
	/**
	 * The ID of the user the command was used on.
	 */
	public get targetId(): Snowflake {
		return this.data.target_id;
	}

	/**
	 * The user the command was used on.
	 */
	public get targetUser(): APIUser {
		return transformUserInteraction(this.data).user;
	}

	/**
	 * The member the command was used on, or `null` when the command was not used in a guild.
	 */
	public get targetMember(): APIInteractionDataResolvedGuildMember | null {
		return transformUserInteraction(this.data).member;
	}
}

export namespace UserContextMenuCommandInteraction {
	export type Type = APIUserApplicationCommandInteraction;
}
