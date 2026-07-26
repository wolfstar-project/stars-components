import { Command, RegisterCommand } from '@wolfstar/http-framework';
import { resolveUserKey } from '@wolfstar/http-framework-i18n';
import { MessageFlags } from 'discord-api-types/v10';
import { PingReply } from '../lib/LanguageKeys.js';

@RegisterCommand((builder) =>
	builder //
		.setName('ping')
		.setDescription('Replies with a localized pong!')
)
export class PingCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({
			content: resolveUserKey(interaction, PingReply),
			flags: MessageFlags.Ephemeral
		});
	}
}
