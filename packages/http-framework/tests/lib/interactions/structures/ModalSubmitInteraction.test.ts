import { ComponentType, type APIModalSubmitInteraction, type APIRole } from 'discord-api-types/v10';
import { ModalSubmitInteraction } from '../../../../src/index.js';
import { ModalSubmitInteractionData, UserData, makeResponse } from '../../../shared.js';

const role = { id: '10', name: 'mods' } as APIRole;

const build = (data: Partial<APIModalSubmitInteraction['data']>) =>
	new ModalSubmitInteraction(makeResponse(), {
		...ModalSubmitInteractionData,
		data: { ...ModalSubmitInteractionData.data, ...data }
	} as APIModalSubmitInteraction);

describe('ModalSubmitInteraction#fields', () => {
	test('GIVEN text inputs in action rows and labels THEN finds them by custom id', () => {
		const interaction = build({
			components: [
				{ type: ComponentType.ActionRow, id: 1, components: [{ type: ComponentType.TextInput, id: 2, custom_id: 'title', value: 'Hello' }] },
				{ type: ComponentType.Label, id: 3, component: { type: ComponentType.TextInput, id: 4, custom_id: 'reason', value: 'Because' } }
			]
		} as never);

		expect<string>(interaction.fields.getTextInput('title')).toBe('Hello');
		expect<string>(interaction.fields.getTextInput('reason')).toBe('Because');
	});

	test('GIVEN selects THEN resolves users and roles from the resolved data', () => {
		const interaction = build({
			components: [
				{
					type: ComponentType.Label,
					id: 1,
					component: { type: ComponentType.StringSelect, id: 2, custom_id: 'color', values: ['red', 'blue'] }
				},
				{ type: ComponentType.Label, id: 3, component: { type: ComponentType.UserSelect, id: 4, custom_id: 'who', values: [UserData.id] } },
				{ type: ComponentType.Label, id: 5, component: { type: ComponentType.RoleSelect, id: 6, custom_id: 'roles', values: [role.id] } }
			],
			resolved: { users: { [UserData.id]: UserData }, roles: { [role.id]: role } }
		} as never);

		expect(interaction.fields.getSelectedStrings('color')).toEqual(['red', 'blue']);
		expect(interaction.fields.getSelectedUsers('who')).toEqual([UserData]);
		expect(interaction.fields.getSelectedRoles('roles')).toEqual([role]);
	});

	test('GIVEN channel and mentionable selects and files THEN resolves them from the resolved data', () => {
		const channel = { id: '20', name: 'general', type: 0 };
		const attachment = { id: '30', filename: 'a.png' };
		const interaction = build({
			components: [
				{ type: ComponentType.TextDisplay, id: 1, content: 'ignored' },
				{
					type: ComponentType.Label,
					id: 2,
					component: { type: ComponentType.ChannelSelect, id: 3, custom_id: 'chan', values: [channel.id] }
				},
				{
					type: ComponentType.Label,
					id: 4,
					component: { type: ComponentType.MentionableSelect, id: 5, custom_id: 'ment', values: [UserData.id, role.id] }
				},
				{ type: ComponentType.Label, id: 6, component: { type: ComponentType.FileUpload, id: 7, custom_id: 'file', values: [attachment.id] } }
			],
			resolved: {
				users: { [UserData.id]: UserData },
				roles: { [role.id]: role },
				channels: { [channel.id]: channel },
				attachments: { [attachment.id]: attachment }
			}
		} as never);

		expect(interaction.fields.getSelectedChannels('chan')).toEqual([channel]);
		expect(interaction.fields.getSelectedMentionables('ment')).toEqual([UserData, role]);
		expect(interaction.fields.getAttachments('file')).toEqual([attachment]);
	});

	test('GIVEN a user select without resolved data THEN getSelectedMembers throws a TypeError', () => {
		const interaction = build({
			components: [
				{ type: ComponentType.Label, id: 1, component: { type: ComponentType.UserSelect, id: 2, custom_id: 'who', values: [UserData.id] } }
			]
		} as never);

		expect(() => interaction.fields.getSelectedMembers('who')).toThrow(TypeError);
	});

	test('GIVEN a missing or mistyped component THEN throws', () => {
		const interaction = build({
			components: [{ type: ComponentType.Label, id: 1, component: { type: ComponentType.TextInput, id: 2, custom_id: 'title', value: 'x' } }]
		} as never);

		expect(() => interaction.fields.getTextInput('nope')).toThrow('not found');
		expect(() => interaction.fields.getSelectedStrings('title')).toThrow();
	});

	test('GIVEN two reads THEN reuses the resolver', () => {
		const interaction = build({ components: [] });

		expect(interaction.fields).toBe(interaction.fields);
	});
});
