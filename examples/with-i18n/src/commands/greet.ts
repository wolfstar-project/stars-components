import { Command, RegisterCommand } from '@wolfstar/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageT } from '@wolfstar/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, 'commands/greet:name', 'commands/greet:description') //
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		.addStringOption((option) => applyLocalizedBuilder(option, 'commands/greet:optionsName').setRequired(true).setMinLength(1).setMaxLength(32))
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction, { name }: Options) {
		const t = getSupportedUserLanguageT(interaction, 'commands/greet');
		return interaction.reply({
			content: t('reply', { name }),
			flags: MessageFlags.Ephemeral
		});
	}
}

interface Options {
	name: string;
}
