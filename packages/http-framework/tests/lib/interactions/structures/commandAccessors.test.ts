import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	type APIApplicationCommandAutocompleteInteraction,
	type APIChatInputApplicationCommandInteraction,
	type APIInteractionDataResolvedGuildMember
} from 'discord-api-types/v10';
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction
} from '../../../../src/index.js';
import {
	ApplicationCommandAutocompleteInteractionData,
	ChatInputApplicationCommandInteractionData,
	InteractionGuildMemberData,
	MessageApplicationCommandInteractionData,
	MessageData,
	UserApplicationCommandInteractionData,
	UserData,
	makeResponse
} from '../../../shared.js';

const resolvedMember = { ...InteractionGuildMemberData } as unknown as APIInteractionDataResolvedGuildMember;

describe('ChatInputCommandInteraction#options', () => {
	test('GIVEN no options THEN returns no subcommand', () => {
		const interaction = new ChatInputCommandInteraction(makeResponse(), ChatInputApplicationCommandInteractionData);

		expect(interaction.options).toEqual({ subCommand: null, subCommandGroup: null });
	});

	test('GIVEN top-level options THEN resolves users, strings and numbers', () => {
		const data: APIChatInputApplicationCommandInteraction = {
			...ChatInputApplicationCommandInteractionData,
			data: {
				...ChatInputApplicationCommandInteractionData.data,
				resolved: { users: { [UserData.id]: UserData }, members: { [UserData.id]: resolvedMember } },
				options: [
					{ type: ApplicationCommandOptionType.String, name: 'reason', value: 'spam' },
					{ type: ApplicationCommandOptionType.Integer, name: 'days', value: 3 },
					{ type: ApplicationCommandOptionType.User, name: 'target', value: UserData.id }
				]
			}
		};
		const { options } = new ChatInputCommandInteraction(makeResponse(), data);

		expect(options.reason).toBe('spam');
		expect(options.days).toBe(3);
		expect(options.target).toEqual({ id: UserData.id, user: UserData, member: resolvedMember });
	});

	test('GIVEN a nested subcommand THEN flattens it and exposes the names', () => {
		const data: APIChatInputApplicationCommandInteraction = {
			...ChatInputApplicationCommandInteractionData,
			data: {
				...ChatInputApplicationCommandInteractionData.data,
				options: [
					{
						type: ApplicationCommandOptionType.SubcommandGroup,
						name: 'settings',
						options: [
							{
								type: ApplicationCommandOptionType.Subcommand,
								name: 'language',
								options: [{ type: ApplicationCommandOptionType.String, name: 'value', value: 'it' }]
							}
						]
					}
				]
			}
		};
		const { options } = new ChatInputCommandInteraction(makeResponse(), data);

		expect(options).toEqual({ subCommandGroup: 'settings', subCommand: 'language', value: 'it' });
	});

	test('GIVEN a user option missing from resolved THEN keeps the id', () => {
		const data: APIChatInputApplicationCommandInteraction = {
			...ChatInputApplicationCommandInteractionData,
			data: {
				...ChatInputApplicationCommandInteractionData.data,
				options: [{ type: ApplicationCommandOptionType.User, name: 'target', value: '1' }]
			}
		};
		const { options } = new ChatInputCommandInteraction(makeResponse(), data);

		expect(options.target).toEqual({ id: '1', user: null, member: null });
	});
});

describe('AutocompleteInteraction', () => {
	const withOptions = (options: APIApplicationCommandAutocompleteInteraction['data']['options']) =>
		new AutocompleteInteraction(makeResponse(), {
			...ApplicationCommandAutocompleteInteractionData,
			data: { ...ApplicationCommandAutocompleteInteractionData.data, options }
		});

	test('GIVEN no focused option THEN focused is null on both accessors', () => {
		const interaction = withOptions([]);

		expect(interaction.focused).toBeNull();
		expect(interaction.options.focused).toBeNull();
	});

	test('GIVEN a focused option THEN returns it and its name', () => {
		const interaction = withOptions([
			{ type: ApplicationCommandOptionType.Integer, name: 'amount', value: 4 },
			{ type: ApplicationCommandOptionType.String, name: 'query', value: 'wol', focused: true }
		]);

		expect(interaction.focused).toEqual({ type: ApplicationCommandOptionType.String, name: 'query', value: 'wol', focused: true });
		expect(interaction.options.focused).toBe('query');
		expect(interaction.options.amount).toBe(4);
	});

	test('GIVEN a focused option inside a subcommand THEN finds it', () => {
		const interaction = withOptions([
			{
				type: ApplicationCommandOptionType.Subcommand,
				name: 'add',
				options: [{ type: ApplicationCommandOptionType.String, name: 'role', value: 'mo', focused: true }]
			}
		]);

		expect(interaction.focused?.name).toBe('role');
		expect(interaction.options.subCommand).toBe('add');
	});
});

describe('UserContextMenuCommandInteraction', () => {
	test('GIVEN a guild interaction THEN exposes the target user and member', () => {
		const data = {
			...UserApplicationCommandInteractionData,
			data: {
				...UserApplicationCommandInteractionData.data,
				resolved: { users: { [UserData.id]: UserData }, members: { [UserData.id]: resolvedMember } }
			}
		};
		const interaction = new UserContextMenuCommandInteraction(makeResponse(), data);

		expect(interaction.targetId).toBe(UserData.id);
		expect(interaction.targetUser).toBe(UserData);
		expect(interaction.targetMember).toBe(resolvedMember);
	});

	test('GIVEN a DM interaction THEN targetMember is null', () => {
		const interaction = new UserContextMenuCommandInteraction(makeResponse(), UserApplicationCommandInteractionData);

		expect(interaction.targetUser).toBe(UserData);
		expect(interaction.targetMember).toBeNull();
	});
});

describe('MessageContextMenuCommandInteraction', () => {
	test('GIVEN a message target THEN exposes its id and message', () => {
		const interaction = new MessageContextMenuCommandInteraction(makeResponse(), MessageApplicationCommandInteractionData);

		expect(interaction.targetId).toBe(MessageData.id);
		expect(interaction.targetMessage).toBe(MessageData);
		expect(MessageApplicationCommandInteractionData.data.type).toBe(ApplicationCommandType.Message);
	});
});
