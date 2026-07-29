import { LanguageKeys } from '#lib/i18n/LanguageKeys.js';
import { Command } from '@wolfstar/http-framework';
import { applyLocalizedBuilder, resolveUserKey } from '@wolfstar/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Math;

export class UserCommand extends Command {
	registerApplicationCommands(registry) {
		registry
			.registerChatInputCommand((builder) =>
				applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription)
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
					.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
			)
			.registerSubcommand(
				(builder) =>
					applyLocalizedBuilder(builder, Root.AddName, Root.AddDescription)
						.addNumberOption((option) => applyLocalizedBuilder(option, Root.OptionsLeft).setRequired(true))
						.addNumberOption((option) => applyLocalizedBuilder(option, Root.OptionsRight).setRequired(true)),
				'add'
			)
			.registerSubcommand(
				(builder) =>
					applyLocalizedBuilder(builder, Root.SubtractName, Root.SubtractDescription)
						.addNumberOption((option) => applyLocalizedBuilder(option, Root.OptionsLeft).setRequired(true))
						.addNumberOption((option) => applyLocalizedBuilder(option, Root.OptionsRight).setRequired(true)),
				'subtract'
			);
	}

	add(interaction, { left, right }) {
		return interaction.reply({
			content: resolveUserKey(interaction, Root.Result, { left, right, result: left + right })
		});
	}

	subtract(interaction, { left, right }) {
		return interaction.reply({
			content: resolveUserKey(interaction, Root.Result, { left, right, result: left - right })
		});
	}
}
