import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { transformInteraction, type InteractionArguments, type TransformedArguments } from '../../resolvers/InteractionOptions.js';
import { CommandInteraction } from './base/CommandInteraction.js';

export class ChatInputCommandInteraction extends CommandInteraction<ChatInputCommandInteraction.Type> {
	/**
	 * The options of the command, resolved the same way as the ones the command handler receives.
	 *
	 * Subcommands and subcommand groups are flattened: their names are in `subCommand` and `subCommandGroup`, and `options`
	 * holds the options of the innermost one. Resolved users, members, roles, channels and attachments are already looked
	 * up in the payload.
	 *
	 * @remarks Every access builds a new object. Read it once when you need several options.
	 * @seealso {@link ChatInputCommandInteraction.data} for the raw data.
	 */
	public get options(): ChatInputCommandInteraction.Options {
		return transformInteraction(this.data.resolved ?? {}, this.data.options ?? []);
	}
}

export namespace ChatInputCommandInteraction {
	export type Type = APIChatInputApplicationCommandInteraction;
	export type Options = InteractionArguments<Record<string, TransformedArguments.Any>>;
}
