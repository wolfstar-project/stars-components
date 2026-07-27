import { ContextMenuCommandBuilder, SlashCommandBuilder } from '@discordjs/builders';
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	type APIChatInputApplicationCommandInteractionData,
	type APIContextMenuInteractionData,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	type RESTPostAPIContextMenuApplicationCommandsJSONBody
} from 'discord-api-types/v10';
import { applicationCommandRegistry, Command, RegisterCommand, RegisterSubcommand, type ApplicationCommandRegistryEntry } from '../../src/index.js';
import { ChatInputApplicationCommandInteractionData, MessageApplicationCommandInteractionData } from '../shared.js';
import { buildSubcommand, getAndDelete, makeCommand } from '../util/util.js';

describe('Command#registerApplicationCommands', () => {
	function validateChatInput(entry: ApplicationCommandRegistryEntry) {
		expect(entry.chatInput).not.toBeNull();
		expect(entry.contextMenu).toHaveLength(0);
		return entry;
	}

	test('GIVEN a command registered via registerApplicationCommands THEN returns expected body', () => {
		class UserCommand extends Command {
			public override registerApplicationCommands(registry: Command.Registry) {
				registry.registerChatInputCommand({ name: 'ping', description: 'Runs a network connection test with me' });
			}

			public override chatInputRun(interaction: Command.ChatInputInteraction) {
				return interaction.reply({ content: 'Pong!' });
			}
		}

		makeCommand(UserCommand);
		const entry = validateChatInput(getAndDelete(UserCommand));
		const json: RESTPostAPIChatInputApplicationCommandsJSONBody = {
			name: 'ping',
			description: 'Runs a network connection test with me',
			type: ApplicationCommandType.ChatInput
		};
		expect(entry.toJSON()).toEqual([json]);
	});

	test('GIVEN a SlashCommandBuilder callback THEN calls the callback on construction', () => {
		const cb = vi.fn((builder: SlashCommandBuilder) => builder.setName('ping').setDescription('Runs a network connection test with me'));

		class UserCommand extends Command {
			public override registerApplicationCommands(registry: Command.Registry) {
				registry.registerChatInputCommand(cb);
			}

			public override chatInputRun(interaction: Command.ChatInputInteraction) {
				return interaction.reply({ content: 'Pong!' });
			}
		}

		expect(cb).not.toHaveBeenCalled();

		const command = makeCommand(UserCommand);
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledWith(expect.any(SlashCommandBuilder));
		expect(command.registry).not.toBeNull();

		getAndDelete(UserCommand);
	});

	test('GIVEN subcommands registered via registerSubcommand THEN routes to the linked methods', () => {
		const ChatInputInteraction: APIChatInputApplicationCommandInteractionData = {
			...ChatInputApplicationCommandInteractionData.data,
			name: 'math'
		};
		const ChatInputInteractionAdd: APIChatInputApplicationCommandInteractionData = {
			...ChatInputApplicationCommandInteractionData.data,
			name: 'math',
			options: [{ name: 'add', type: ApplicationCommandOptionType.Subcommand, options: [] }]
		};
		const ChatInputInteractionSubtract: APIChatInputApplicationCommandInteractionData = {
			...ChatInputApplicationCommandInteractionData.data,
			name: 'math',
			options: [{ name: 'subtract', type: ApplicationCommandOptionType.Subcommand, options: [] }]
		};

		class UserCommand extends Command {
			public override registerApplicationCommands(registry: Command.Registry) {
				registry
					.registerChatInputCommand({ name: 'math', description: 'Does some maths' })
					.registerSubcommand(buildSubcommand('add', 'Adds two numbers'), 'add')
					.registerSubcommand(buildSubcommand('subtract', 'Subtracts two numbers'), 'subtract');
			}

			public add(interaction: Command.ChatInputInteraction) {
				return interaction.reply({ content: 'Added!' });
			}

			public subtract(interaction: Command.ChatInputInteraction) {
				return interaction.reply({ content: 'Subtracted!' });
			}
		}

		const command = makeCommand(UserCommand);
		expect(command.router.chatInputName).toBe('math');
		expect(command.router.routeChatInputInteraction(ChatInputInteraction)).toBe('chatInputRun');
		expect(command.router.routeChatInputInteraction(ChatInputInteractionAdd)).toBe('add');
		expect(command.router.routeChatInputInteraction(ChatInputInteractionSubtract)).toBe('subtract');

		getAndDelete(UserCommand);
	});

	test('GIVEN a subcommand group registered via registerSubcommandGroup THEN routes to the linked method', () => {
		const ChatInputInteractionGroup: APIChatInputApplicationCommandInteractionData = {
			...ChatInputApplicationCommandInteractionData.data,
			name: 'ping',
			options: [
				{
					name: 'network',
					type: ApplicationCommandOptionType.SubcommandGroup,
					options: [{ name: 'latency', type: ApplicationCommandOptionType.Subcommand, options: [] }]
				}
			]
		};

		class UserCommand extends Command {
			public override registerApplicationCommands(registry: Command.Registry) {
				registry
					.registerChatInputCommand({ name: 'ping', description: 'Runs a network connection test with me' })
					.registerSubcommandGroup({ name: 'network', description: 'Network tests' })
					.registerSubcommand(buildSubcommand('latency', 'Runs a network latency test with me'), 'networkLatency', 'network');
			}

			public networkLatency(interaction: Command.ChatInputInteraction) {
				return interaction.reply({ content: 'Pong!' });
			}
		}

		const command = makeCommand(UserCommand);
		expect(command.router.routeChatInputInteraction(ChatInputInteractionGroup)).toBe('networkLatency');

		getAndDelete(UserCommand);
	});

	test('GIVEN a message command registered via registerMessageCommand THEN routes to the linked method', () => {
		const MessageInteraction: APIContextMenuInteractionData = { ...MessageApplicationCommandInteractionData.data, name: 'quote' };

		class UserCommand extends Command {
			public override registerApplicationCommands(registry: Command.Registry) {
				registry.registerMessageCommand({ name: 'quote' }, 'runQuote');
			}

			public runQuote(interaction: Command.MessageInteraction) {
				return interaction.reply({ content: 'Some content' });
			}
		}

		const command = makeCommand(UserCommand);
		expect(command.router.routeContextMenuInteraction(MessageInteraction)).toBe('runQuote');

		const entry = getAndDelete(UserCommand);
		expect(entry.chatInput).toBeNull();
		const json: RESTPostAPIContextMenuApplicationCommandsJSONBody = { name: 'quote', type: ApplicationCommandType.Message };
		expect(entry.toJSON()).toEqual([json]);
	});

	test('GIVEN a user command registered via registerUserCommand THEN returns expected body', () => {
		class UserCommand extends Command {
			public override registerApplicationCommands(registry: Command.Registry) {
				registry.registerUserCommand(new ContextMenuCommandBuilder().setName('avatar').setType(ApplicationCommandType.User), 'runAvatar');
			}

			public runAvatar(interaction: Command.UserInteraction) {
				return interaction.reply({ content: 'Some content' });
			}
		}

		makeCommand(UserCommand);
		const entry = getAndDelete(UserCommand);
		const json: RESTPostAPIContextMenuApplicationCommandsJSONBody = { name: 'avatar', type: ApplicationCommandType.User };
		expect(entry.toJSON()).toEqual([json]);
	});

	test('GIVEN setGuildIds THEN restricts the command to the given guilds', () => {
		class UserCommand extends Command {
			public override registerApplicationCommands(registry: Command.Registry) {
				registry.registerChatInputCommand({ name: 'ping', description: 'Runs a network connection test with me' }).setGuildIds(['1234']);
			}

			public override chatInputRun(interaction: Command.ChatInputInteraction) {
				return interaction.reply({ content: 'Pong!' });
			}
		}

		makeCommand(UserCommand);

		// `getLoadedGlobalCommands`/`getLoadedGuildCommands` resolve every entry ever registered in the process-wide
		// registry, so we only assert on the guild-scoped view here to avoid cross-test-file pollution.
		expect(applicationCommandRegistry.getLoadedGuildCommands().get('1234')).toEqual([
			{ name: 'ping', description: 'Runs a network connection test with me', type: ApplicationCommandType.ChatInput }
		]);

		getAndDelete(UserCommand);
	});

	test('GIVEN the same command shape THEN registerApplicationCommands and decorators produce identical output', () => {
		@RegisterCommand({ name: 'math', description: 'Does some maths' })
		class DecoratedCommand extends Command {
			@RegisterSubcommand(buildSubcommand('add', 'Adds two numbers'))
			public add(interaction: Command.ChatInputInteraction) {
				return interaction.reply({ content: 'Added!' });
			}
		}

		class StructuredCommand extends Command {
			public override registerApplicationCommands(registry: Command.Registry) {
				registry
					.registerChatInputCommand({ name: 'math', description: 'Does some maths' })
					.registerSubcommand(buildSubcommand('add', 'Adds two numbers'), 'add');
			}

			public add(interaction: Command.ChatInputInteraction) {
				return interaction.reply({ content: 'Added!' });
			}
		}

		const decoratedEntry = getAndDelete(DecoratedCommand);
		makeCommand(StructuredCommand);
		const structuredEntry = getAndDelete(StructuredCommand);
		expect(structuredEntry.toJSON()).toEqual(decoratedEntry.toJSON());
	});

	test('GIVEN no registerApplicationCommands override THEN does not throw and has no registry entry', () => {
		class UserCommand extends Command {
			public override chatInputRun(interaction: Command.ChatInputInteraction) {
				return interaction.reply({ content: 'Pong!' });
			}
		}

		const warn = vi.spyOn(console, 'warn');
		expect(() => makeCommand(UserCommand)).not.toThrow();
		expect(applicationCommandRegistry.get(UserCommand)).toBeNull();

		warn.mockClear();
	});
});
