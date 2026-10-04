import { ApplicationCommandOptionType, ApplicationCommandType, type APIChatInputApplicationCommandInteractionData } from 'discord-api-types/v10';
import type { Bench } from 'tinybench';
import { Command, RegisterCommand, RegisterSubcommand, RegisterSubcommandGroup } from '../packages/http-framework/src/index.js';
import { makeCommand } from '../packages/http-framework-test-utils/src/commands.js';

// Node's type stripping has no decorator syntax, but a decorator is a plain function: this is what
// `@RegisterCommand(...)`, `@RegisterSubcommandGroup(...)` and `@RegisterSubcommand(...)` on the class below compile to.
class ToolsCommand extends Command {
	public runPing(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: 'Pong!' });
	}

	public runNested(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: 'Nested!' });
	}
}

RegisterSubcommand({ name: 'ping', description: 'Pings' })(ToolsCommand.prototype, 'runPing');
RegisterSubcommand({ name: 'nested', description: 'Nested' }, 'group')(ToolsCommand.prototype, 'runNested');
RegisterSubcommandGroup({ name: 'group', description: 'A group' })(ToolsCommand.prototype, 'runNested');
RegisterCommand({ name: 'tools', description: 'Benchmarks the router' })(ToolsCommand);

const base: APIChatInputApplicationCommandInteractionData = { id: '1', name: 'tools', type: ApplicationCommandType.ChatInput };
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

export function register(bench: Bench) {
	const command = makeCommand(ToolsCommand);
	// Fail here, loudly, instead of inside a benchmark.
	if (command.router.routeChatInputInteraction(grouped) !== 'runNested') throw new Error('The router did not resolve the subcommand group');

	bench
		.add('http-framework: build a command with subcommands', () => {
			makeCommand(ToolsCommand);
		})
		.add('http-framework: route a top-level chat input interaction', () => {
			command.router.routeChatInputInteraction(base);
		})
		.add('http-framework: route a subcommand', () => {
			command.router.routeChatInputInteraction(subcommand);
		})
		.add('http-framework: route a subcommand inside a group', () => {
			command.router.routeChatInputInteraction(grouped);
		});
}
