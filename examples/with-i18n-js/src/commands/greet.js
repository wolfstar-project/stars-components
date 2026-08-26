import { LanguageKeys } from '#lib/i18n/LanguageKeys.js';
import { Command } from '@wolfstar/http-framework';
import { applyLocalizedBuilder, resolveUserKey } from '@wolfstar/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Greet;

export class UserCommand extends Command {
	registerApplicationCommands(registry) {
		registry.registerChatInputCommand((builder) =>
			applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription)
				.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
				.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
				.addStringOption((option) => applyLocalizedBuilder(option, Root.OptionsName).setRequired(true).setMinLength(1).setMaxLength(32))
		);
	}

	chatInputRun(interaction, { name }) {
		return interaction.reply({
			content: resolveUserKey(interaction, Root.Reply, { name }),
			flags: MessageFlags.Ephemeral
		});
	}
}
