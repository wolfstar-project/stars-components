import { Command, RegisterCommand, container } from '@wolfstar/http-framework';
import type { GatewayClient } from '@wolfstar/plugin-gateway';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	builder //
		.setName('whoami')
		.setDescription('Look yourself up through the cache, falling back to the REST API')
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction) {
		const client = container.client as GatewayClient;
		const userId = interaction.user.id;

		// `get` only reads the cache; `fetch` reads it too, but falls back to the REST API on a miss and caches the result.
		const cached = await client.users.get(userId);
		const user = cached ?? (await client.users.fetch(userId));

		return interaction.reply({
			content: `You are **${user.username}**, ${cached ? 'read from the cache' : 'fetched from the API and cached for next time'}.`,
			flags: MessageFlags.Ephemeral
		});
	}
}
