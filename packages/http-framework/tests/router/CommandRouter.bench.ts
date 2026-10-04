import { ApplicationCommandOptionType, type APIChatInputApplicationCommandInteractionData } from 'discord-api-types/v10';
import { bench, describe } from 'vitest';
import { Command, RegisterCommand, RegisterSubcommand, RegisterSubcommandGroup } from '../../src/index.js';
import { ChatInputApplicationCommandInteractionData } from '../shared.js';
import { makeCommand } from '../util/util.js';

@RegisterCommand({ name: 'tools', description: 'Benchmarks the router' })
class ToolsCommand extends Command {
	@RegisterSubcommand({ name: 'ping', description: 'Pings' })
	public runPing(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: 'Pong!' });
	}

	@RegisterSubcommandGroup({ name: 'group', description: 'A group' })
	@RegisterSubcommand({ name: 'nested', description: 'Nested' }, 'group')
	public runNested(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: 'Nested!' });
	}
}

const command = makeCommand(ToolsCommand);
const base: APIChatInputApplicationCommandInteractionData = { ...ChatInputApplicationCommandInteractionData.data, name: 'tools' };
const plain = base;
const subcommand: APIChatInputApplicationCommandInteractionData = {
	...base,
	options: [{ name: 'ping', type: ApplicationCommandOptionType.Subcommand, options: [] }]
};
const grouped: APIChatInputApplicationCommandInteractionData = {
	...base,
	options: [
		{
			name: 'group',
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [{ name: 'nested', type: ApplicationCommandOptionType.Subcommand, options: [] }]
		}
	]
};

describe('CommandRouter', () => {
	bench('build a command with a subcommand and a subcommand group', () => {
		makeCommand(ToolsCommand);
	});

	bench('route a top-level chat input interaction', () => {
		command.router.routeChatInputInteraction(plain);
	});

	bench('route a subcommand', () => {
		command.router.routeChatInputInteraction(subcommand);
	});

	bench('route a subcommand inside a group', () => {
		command.router.routeChatInputInteraction(grouped);
	});

	bench('serialise the registry to JSON', () => {
		command.registry!.chatInput!.toJSON();
	});
});
