import type { APIInteractionDataResolvedChannel, APIRole } from 'discord-api-types/v10';
import {
	MessageComponentButtonInteraction,
	MessageComponentChannelSelectInteraction,
	MessageComponentMentionableSelectInteraction,
	MessageComponentRoleSelectInteraction,
	MessageComponentStringSelectInteraction,
	MessageComponentUserSelectInteraction
} from '../../../../src/index.js';
import {
	MessageComponentButtonInteractionData,
	MessageComponentChannelSelectInteractionData,
	MessageComponentMentionableSelectInteractionData,
	MessageComponentRoleSelectInteractionData,
	MessageComponentStringSelectInteractionData,
	MessageComponentUserSelectInteractionData,
	UserData,
	makeResponse
} from '../../../shared.js';

const role = { id: '10', name: 'mods' } as APIRole;
const channel = { id: '20', name: 'general', type: 0 } as APIInteractionDataResolvedChannel;

describe('MessageComponentInteraction#resolved', () => {
	test('GIVEN a button or a string select THEN resolved is null', () => {
		const button = new MessageComponentButtonInteraction(makeResponse(), MessageComponentButtonInteractionData);
		const string = new MessageComponentStringSelectInteraction(makeResponse(), MessageComponentStringSelectInteractionData);

		expect(button.resolved).toBeNull();
		expect(string.resolved).toBeNull();
	});

	test('GIVEN a user select THEN returns the raw resolved data and pairs it with the ids', () => {
		const data = {
			...MessageComponentUserSelectInteractionData,
			data: { ...MessageComponentUserSelectInteractionData.data, values: [UserData.id], resolved: { users: { [UserData.id]: UserData } } }
		};
		const interaction = new MessageComponentUserSelectInteraction(makeResponse(), data);

		expect(interaction.resolved).toBe(data.data.resolved);
		expect(interaction.users.get(UserData.id)).toEqual({ id: UserData.id, user: UserData, member: null });
	});

	test('GIVEN a role select THEN pairs the ids with the resolved roles', () => {
		const data = {
			...MessageComponentRoleSelectInteractionData,
			data: { ...MessageComponentRoleSelectInteractionData.data, values: [role.id], resolved: { roles: { [role.id]: role } } }
		};
		const interaction = new MessageComponentRoleSelectInteraction(makeResponse(), data);

		expect(interaction.resolved.roles).toEqual({ [role.id]: role });
		expect(interaction.roles.get(role.id)).toBe(role);
	});

	test('GIVEN a channel select THEN pairs the ids with the resolved channels', () => {
		const data = {
			...MessageComponentChannelSelectInteractionData,
			data: { ...MessageComponentChannelSelectInteractionData.data, values: [channel.id], resolved: { channels: { [channel.id]: channel } } }
		};
		const interaction = new MessageComponentChannelSelectInteraction(makeResponse(), data);

		expect(interaction.resolved.channels).toEqual({ [channel.id]: channel });
		expect(interaction.channels.get(channel.id)).toBe(channel);
	});

	test('GIVEN a mentionable select THEN splits users, roles and unknown ids', () => {
		const data = {
			...MessageComponentMentionableSelectInteractionData,
			data: {
				...MessageComponentMentionableSelectInteractionData.data,
				values: [UserData.id, role.id, '99'],
				resolved: { users: { [UserData.id]: UserData }, members: {}, roles: { [role.id]: role } }
			}
		};
		const interaction = new MessageComponentMentionableSelectInteraction(makeResponse(), data);

		expect(interaction.resolved).toBe(data.data.resolved);
		expect([...interaction.users.keys()]).toEqual([UserData.id]);
		expect([...interaction.roles.keys()]).toEqual([role.id]);
		expect([...interaction.mentionables.values()]).toEqual([
			{ id: UserData.id, user: UserData, member: null },
			{ id: role.id, role },
			{ id: '99' }
		]);
	});
});
