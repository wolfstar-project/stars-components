import { Command, RegisterCommand, RegisterSubcommand } from '@wolfstar/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageT } from '@wolfstar/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, 'commands/math:name', 'commands/math:description') //
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
)
export class UserCommand extends Command {
	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, 'commands/math:addName', 'commands/math:addDescription') //
			.addNumberOption((option) => applyLocalizedBuilder(option, 'commands/math:optionsLeft').setRequired(true))
			.addNumberOption((option) => applyLocalizedBuilder(option, 'commands/math:optionsRight').setRequired(true))
	)
	public add(interaction: Command.ChatInputInteraction, { left, right }: Options) {
		const t = getSupportedUserLanguageT(interaction, 'commands/math');
		return interaction.reply({
			content: t('result', { left, right, result: left + right })
		});
	}

	@RegisterSubcommand((builder) =>
		applyLocalizedBuilder(builder, 'commands/math:subtractName', 'commands/math:subtractDescription') //
			.addNumberOption((option) => applyLocalizedBuilder(option, 'commands/math:optionsLeft').setRequired(true))
			.addNumberOption((option) => applyLocalizedBuilder(option, 'commands/math:optionsRight').setRequired(true))
	)
	public subtract(interaction: Command.ChatInputInteraction, { left, right }: Options) {
		const t = getSupportedUserLanguageT(interaction, 'commands/math');
		return interaction.reply({
			content: t('result', { left, right, result: left - right })
		});
	}
}

interface Options {
	left: number;
	right: number;
}
