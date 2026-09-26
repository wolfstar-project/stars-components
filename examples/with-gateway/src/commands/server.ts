import { Command, RegisterCommand, container } from '@wolfstar/http-framework';
import type { GatewayClient } from '@wolfstar/plugin-gateway';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	builder //
		.setName('server')
		.setDescription('Show what the gateway cache knows about this server')
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
		.setContexts(InteractionContextType.Guild)
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction) {
		const client = container.client as GatewayClient;

		// `get` only reads the cache the gateway keeps up to date, it never calls the REST API.
		const guild = await client.guilds.get(interaction.guildId!);
		if (!guild) {
			return interaction.reply({ content: 'This server is not cached yet: is the bot in it?', flags: MessageFlags.Ephemeral });
		}

		return interaction.reply({
			content: [`**${guild.name}**`, `Members: ${guild.memberCount ?? 'unknown'}`, `Owner: <@${guild.ownerId}>`].join('\n'),
			flags: MessageFlags.Ephemeral
		});
	}
}
