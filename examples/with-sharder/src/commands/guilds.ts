import { Command, RegisterCommand } from '@wolfstar/http-framework';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags } from 'discord-api-types/v10';
import { shard, type ShardRequest } from '../lib/shard.js';

@RegisterCommand((builder) =>
	builder //
		.setName('guilds')
		.setDescription('Count the servers of every shard')
		.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
		.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
)
export class UserCommand extends Command {
	public override async chatInputRun(interaction: Command.ChatInputInteraction) {
		// Replaces discord.js's `broadcastEval`/`fetchClientValues`: one reply per worker, including this one.
		const counts = await shard.broadcastRequest<number>({ type: 'guildCount' } satisfies ShardRequest, { timeout: 2_000 });
		const total = counts.reduce((sum, count) => sum + count, 0);

		return interaction.reply({
			content: `${total} servers across ${counts.length} workers (answered by worker ${shard.id}).`,
			flags: MessageFlags.Ephemeral
		});
	}
}
