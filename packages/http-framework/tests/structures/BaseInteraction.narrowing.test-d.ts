import type { APIInteractionGuildMember, APIUser, Locale, Snowflake } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InDM, InGuild } from '../../src/index.js';

/**
 * `inGuild()` and `inDM()` are type guards: the narrowing is the feature, so it is pinned here, where Vitest checks
 * the types. The runtime behavior is in `lib/interactions/structures/base/BaseInteraction.test.ts`.
 */
describe('BaseInteraction#inGuild and #inDM', () => {
	test('inGuild narrows the guild fields, the member and the user', (_ctx) => {
		const interaction = {} as ChatInputCommandInteraction;

		if (interaction.inGuild()) {
			expectTypeOf(interaction).toExtend<InGuild<ChatInputCommandInteraction>>();
			expectTypeOf(interaction.guild_id).toEqualTypeOf<Snowflake>();
			expectTypeOf(interaction.guildId).toEqualTypeOf<Snowflake>();
			expectTypeOf(interaction.guild_locale).toEqualTypeOf<Locale>();
			expectTypeOf(interaction.guildLocale).toEqualTypeOf<Locale>();
			expectTypeOf(interaction.member).toEqualTypeOf<APIInteractionGuildMember>();
			expectTypeOf(interaction.user).toEqualTypeOf<APIUser>();
		}
	});

	test('inDM narrows the guild fields and the member to undefined', (_ctx) => {
		const interaction = {} as ChatInputCommandInteraction;

		if (interaction.inDM()) {
			expectTypeOf(interaction).toExtend<InDM<ChatInputCommandInteraction>>();
			expectTypeOf(interaction.guild_id).toEqualTypeOf<undefined>();
			expectTypeOf(interaction.guildId).toEqualTypeOf<undefined>();
			expectTypeOf(interaction.guild_locale).toEqualTypeOf<undefined>();
			expectTypeOf(interaction.guildLocale).toEqualTypeOf<undefined>();
			expectTypeOf(interaction.member).toEqualTypeOf<undefined>();
			expectTypeOf(interaction.user).toEqualTypeOf<APIUser>();
		}
	});

	test('without a guard the guild fields stay optional', (_ctx) => {
		const interaction = {} as ChatInputCommandInteraction;

		expectTypeOf(interaction.guild_id).toEqualTypeOf<Snowflake | undefined>();
		expectTypeOf(interaction.guild_locale).toEqualTypeOf<Locale | undefined>();
		expectTypeOf(interaction.member).toEqualTypeOf<APIInteractionGuildMember | undefined>();
		expectTypeOf(interaction.user).toEqualTypeOf<APIUser>();
	});
});
