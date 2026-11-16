import type {
	APIMessageChannelSelectInteractionData,
	APIMessageMentionableSelectInteractionData,
	APIMessageRoleSelectInteractionData,
	APIMessageUserSelectInteractionData
} from 'discord-api-types/v10';
import type {
	MessageComponentButtonInteraction,
	MessageComponentChannelSelectInteraction,
	MessageComponentMentionableSelectInteraction,
	MessageComponentRoleSelectInteraction,
	MessageComponentStringSelectInteraction,
	MessageComponentUserSelectInteraction
} from '../../src/index.js';

/**
 * `MessageComponentInteraction#resolved` follows the variant: the selects that carry resolved data return it as Discord
 * shapes it, and the button and the string select return `null`. Vitest checks this file, while the runtime values are in
 * `lib/interactions/structures/selectResolved.test.ts`.
 */
describe('MessageComponentInteraction#resolved', () => {
	test('buttons and string selects have no resolved data', (_ctx) => {
		expectTypeOf<MessageComponentButtonInteraction['resolved']>().toEqualTypeOf<null>();
		expectTypeOf<MessageComponentStringSelectInteraction['resolved']>().toEqualTypeOf<null>();
	});

	test('the other selects return the resolved data of their payload', (_ctx) => {
		expectTypeOf<MessageComponentUserSelectInteraction['resolved']>().toEqualTypeOf<APIMessageUserSelectInteractionData['resolved']>();
		expectTypeOf<MessageComponentRoleSelectInteraction['resolved']>().toEqualTypeOf<APIMessageRoleSelectInteractionData['resolved']>();
		expectTypeOf<MessageComponentChannelSelectInteraction['resolved']>().toEqualTypeOf<APIMessageChannelSelectInteractionData['resolved']>();
		expectTypeOf<MessageComponentMentionableSelectInteraction['resolved']>().toEqualTypeOf<
			APIMessageMentionableSelectInteractionData['resolved']
		>();
	});
});
