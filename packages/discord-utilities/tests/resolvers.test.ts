import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ComponentType,
	InteractionType,
	type APIApplicationCommandAutocompleteInteraction,
	type APIChatInputApplicationCommandInteraction,
	type APIModalSubmitInteraction,
	type APIUser,
	type APIUserApplicationCommandInteraction
} from 'discord-api-types/v10';
import {
	AutocompleteInteractionOptionResolver,
	ChatInputInteractionOptionResolver,
	ContextMenuInteractionOptionResolver,
	ModalInteractionOptionResolver
} from '../src/index.js';

const user: APIUser = { id: '266624760782258186', username: 'wolfstar', discriminator: '0', avatar: null, global_name: null };
const base = {
	id: '1',
	application_id: '2',
	token: 't',
	version: 1,
	app_permissions: '8',
	locale: 'en-US',
	entitlements: [],
	authorizing_integration_owners: {},
	attachment_size_limit: 1
} as const;

describe('ChatInputInteractionOptionResolver', () => {
	const interaction = {
		...base,
		type: InteractionType.ApplicationCommand,
		data: {
			id: '3',
			name: 'config',
			type: ApplicationCommandType.ChatInput,
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: 'set',
					options: [
						{ type: ApplicationCommandOptionType.String, name: 'key', value: 'prefix' },
						{ type: ApplicationCommandOptionType.User, name: 'target', value: user.id }
					]
				}
			],
			resolved: { users: { [user.id]: user } }
		}
	} as unknown as APIChatInputApplicationCommandInteraction;

	const resolver = new ChatInputInteractionOptionResolver(interaction);

	test('GIVEN a subcommand THEN it is hoisted', () => {
		expect(resolver.getSubcommand()).toBe('set');
		expect(resolver.getSubcommandGroup(false)).toBeNull();
	});

	test('GIVEN typed options THEN they resolve', () => {
		expect(resolver.getString('key')).toBe('prefix');
		expect(resolver.getUser('target')).toEqual(user);
		expect(resolver.getInteger('missing')).toBeNull();
	});

	test('GIVEN a required missing option THEN it throws', () => {
		expect(() => resolver.getString('missing', true)).toThrow('Missing required option "missing"');
	});
});

describe('ContextMenuInteractionOptionResolver', () => {
	test('GIVEN a user command THEN resolves the target user', () => {
		const interaction = {
			...base,
			type: InteractionType.ApplicationCommand,
			data: { id: '3', name: 'Inspect', type: ApplicationCommandType.User, target_id: user.id, resolved: { users: { [user.id]: user } } }
		} as unknown as APIUserApplicationCommandInteraction;
		expect(new ContextMenuInteractionOptionResolver(interaction).getTargetUser()).toEqual(user);
	});
});

describe('AutocompleteInteractionOptionResolver', () => {
	test('GIVEN a focused option THEN returns it without the focused flag', () => {
		const interaction = {
			...base,
			type: InteractionType.ApplicationCommandAutocomplete,
			data: {
				id: '3',
				name: 'tag',
				type: ApplicationCommandType.ChatInput,
				options: [{ type: ApplicationCommandOptionType.String, name: 'name', value: 'wo', focused: true }]
			}
		} as unknown as APIApplicationCommandAutocompleteInteraction;
		expect(new AutocompleteInteractionOptionResolver(interaction).getFocusedOption()).toEqual({
			type: ApplicationCommandOptionType.String,
			name: 'name',
			value: 'wo'
		});
	});
});

describe('ModalInteractionOptionResolver', () => {
	test('GIVEN a text input in an action row THEN returns its value', () => {
		const interaction = {
			...base,
			type: InteractionType.ModalSubmit,
			data: {
				custom_id: 'feedback',
				components: [{ type: ComponentType.ActionRow, components: [{ type: ComponentType.TextInput, custom_id: 'body', value: 'hello' }] }]
			}
		} as unknown as APIModalSubmitInteraction;
		const resolver = new ModalInteractionOptionResolver(interaction);
		expect(resolver.getTextInput('body')).toBe('hello');
		expect(() => resolver.get('nope')).toThrow('Component with custom ID "nope" not found.');
	});
});
