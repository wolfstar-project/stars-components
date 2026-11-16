import type { ModalInteractionOptionResolver } from '@wolfstar/discord-utilities';
import type { APIAttachment, APIRole, APIUser } from 'discord-api-types/v10';
import type { ModalSubmitInteraction } from '../../src/index.js';

/**
 * `ModalSubmitInteraction#fields` is the resolver of `@wolfstar/discord-utilities`, so its getters are what handlers
 * type against. Vitest checks this file, while the runtime values are in
 * `lib/interactions/structures/ModalSubmitInteraction.test.ts`.
 */
describe('ModalSubmitInteraction#fields', () => {
	test('is the modal option resolver', (_ctx) => {
		expectTypeOf<ModalSubmitInteraction['fields']>().toEqualTypeOf<ModalInteractionOptionResolver>();
	});

	test('the getters return typed values', (_ctx) => {
		const { fields } = {} as ModalSubmitInteraction;

		expectTypeOf(fields.getTextInput('id')).toEqualTypeOf<string>();
		expectTypeOf(fields.getSelectedStrings('id')).toEqualTypeOf<string[]>();
		expectTypeOf(fields.getSelectedUsers('id')).toEqualTypeOf<APIUser[]>();
		expectTypeOf(fields.getSelectedRoles('id')).toEqualTypeOf<APIRole[]>();
		expectTypeOf(fields.getAttachments('id')).toEqualTypeOf<APIAttachment[]>();
	});
});
