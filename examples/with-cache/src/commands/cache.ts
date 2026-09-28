import { Command, RegisterCommand, container } from '@wolfstar/http-framework';
import type { CacheEntityName } from '@wolfstar/plugin-cache';
import type { GatewayClient } from '@wolfstar/plugin-gateway';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';

const entities = ['guilds', 'channels', 'roles', 'members', 'users', 'messages'] as const satisfies readonly CacheEntityName[];

@RegisterCommand((builder) =>
	builder //
		.setName('cache')
		.setDescription('Show how many entities the gateway cache holds')
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction) {
		const { cache } = container.client as GatewayClient;
		if (!cache) return interaction.reply({ content: 'The client has no cache.', flags: MessageFlags.Ephemeral });

		// Every `EntityCache` method may return a promise, so the same code reads a `Map` or Redis.
		const sizes = await Promise.all(entities.map(async (entity) => `${entity}: ${await cache[entity].getSize()}`));
		return interaction.reply({ content: sizes.join('\n'), flags: MessageFlags.Ephemeral });
	}
}
