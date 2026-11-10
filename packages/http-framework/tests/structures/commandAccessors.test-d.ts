import type {
	APIApplicationCommandInteractionDataIntegerOption,
	APIApplicationCommandInteractionDataNumberOption,
	APIApplicationCommandInteractionDataStringOption,
	APIInteractionDataResolvedGuildMember,
	APIMessage,
	APIUser,
	Snowflake
} from 'discord-api-types/v10';
import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	MessageContextMenuCommandInteraction,
	TransformedArguments,
	UserContextMenuCommandInteraction
} from '../../src/index.js';

/**
 * The accessors return what the command handler receives, so their types have to match the resolved shapes. Vitest checks
 * this file, while the runtime values are in `lib/interactions/structures/commandAccessors.test.ts`.
 */
describe('command interaction accessors', () => {
	test('ChatInputCommandInteraction#options carries the subcommand names', (_ctx) => {
		const interaction = {} as ChatInputCommandInteraction;

		expectTypeOf(interaction.options.subCommand).toEqualTypeOf<string | null>();
		expectTypeOf(interaction.options.subCommandGroup).toEqualTypeOf<string | null>();
		expectTypeOf(interaction.options.anything).toEqualTypeOf<TransformedArguments.Any>();
	});

	test('AutocompleteInteraction#options and #focused', (_ctx) => {
		const interaction = {} as AutocompleteInteraction;

		expectTypeOf(interaction.options.focused).toEqualTypeOf<string | null>();
		expectTypeOf(interaction.focused).toEqualTypeOf<
			| APIApplicationCommandInteractionDataStringOption
			| APIApplicationCommandInteractionDataIntegerOption
			| APIApplicationCommandInteractionDataNumberOption
			| null
		>();
	});

	test('UserContextMenuCommandInteraction targets', (_ctx) => {
		const interaction = {} as UserContextMenuCommandInteraction;

		expectTypeOf(interaction.targetId).toEqualTypeOf<Snowflake>();
		expectTypeOf(interaction.targetUser).toEqualTypeOf<APIUser>();
		expectTypeOf(interaction.targetMember).toEqualTypeOf<APIInteractionDataResolvedGuildMember | null>();
	});

	test('MessageContextMenuCommandInteraction targets', (_ctx) => {
		const interaction = {} as MessageContextMenuCommandInteraction;

		expectTypeOf(interaction.targetId).toEqualTypeOf<Snowflake>();
		expectTypeOf(interaction.targetMessage).toEqualTypeOf<APIMessage>();
	});
});
