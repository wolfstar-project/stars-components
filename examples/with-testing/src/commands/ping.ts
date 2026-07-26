import { Command, RegisterCommand } from '@wolfstar/http-framework';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	builder //
		.setName('ping')
		.setDescription('Run a network connection test with me')
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
	}
}
