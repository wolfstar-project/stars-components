import { Command } from '@wolfstar/http-framework';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

/**
 * Registered through `registerApplicationCommands` rather than `@RegisterCommand`: the bundler compiles this file
 * without the legacy decorator transform `tsdown` applies.
 */
export class PingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName('ping')
				.setDescription('Run a network connection test with me')
				.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
				.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		);
	}

	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: `Pong! (built at ${__BUILT_AT__})`, flags: MessageFlags.Ephemeral });
	}
}
