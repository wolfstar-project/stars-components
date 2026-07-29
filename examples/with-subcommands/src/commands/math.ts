import { LanguageKeys } from '#lib/i18n/LanguageKeys';
import { Command, RegisterCommand, RegisterSubcommand } from '@wolfstar/http-framework';
import { applyLocalizedBuilder, resolveUserKey } from '@wolfstar/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10';

const Root = LanguageKeys.Commands.Math;

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, Root.RootName, Root.RootDescription) //
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
)
export class UserCommand extends Command {
	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.AddName, Root.AddDescription) //
			.addNumberOption((option) => applyLocalizedBuilder(option, Root.OptionsLeft).setRequired(true))
			.addNumberOption((option) => applyLocalizedBuilder(option, Root.OptionsRight).setRequired(true))
	)
	public add(interaction: Command.ChatInputInteraction, { left, right }: Options) {
		return interaction.reply({
			content: resolveUserKey(interaction, Root.Result, { left, right, result: left + right })
		});
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, Root.SubtractName, Root.SubtractDescription) //
			.addNumberOption((option) => applyLocalizedBuilder(option, Root.OptionsLeft).setRequired(true))
			.addNumberOption((option) => applyLocalizedBuilder(option, Root.OptionsRight).setRequired(true))
	)
	public subtract(interaction: Command.ChatInputInteraction, { left, right }: Options) {
		return interaction.reply({
			content: resolveUserKey(interaction, Root.Result, { left, right, result: left - right })
		});
	}
}

interface Options {
	left: number;
	right: number;
}
