import { Command, RegisterCommand } from '@wolfstar/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageT } from '@wolfstar/http-framework-i18n';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	applyLocalizedBuilder(builder, 'commands/ping:name', 'commands/ping:description') //
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		const t = getSupportedUserLanguageT(interaction, 'commands/ping');
		return interaction.reply({
			content: t('reply'),
			flags: MessageFlags.Ephemeral
		});
	}
}
