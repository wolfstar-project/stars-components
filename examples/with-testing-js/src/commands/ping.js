import { Command } from '@wolfstar/http-framework';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

export class UserCommand extends Command {
	registerApplicationCommands(registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('ping')
				.setDescription('Run a network connection test with me')
				.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
				.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		);
	}

	chatInputRun(interaction) {
		return interaction.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
	}
}
