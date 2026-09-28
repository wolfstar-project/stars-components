import { ChannelType, PermissionFlagsBits as P } from 'discord-api-types/v10';
import {
	canJoinVoiceChannel,
	canReact,
	canReadMessages,
	canRemoveAllReactions,
	canSendAttachments,
	canSendEmbeds,
	canSendMessages,
	resolveAppPermissions
} from '../src/index.js';

const bits = (...flags: bigint[]) => flags.reduce((a, b) => a | b, 0n).toString();

describe('resolveAppPermissions', () => {
	test('GIVEN each source kind THEN resolves or returns null', () => {
		expect(resolveAppPermissions(8n)).toBe(8n);
		expect(resolveAppPermissions('8')).toBe(8n);
		expect(resolveAppPermissions({ app_permissions: '8' })).toBe(8n);
		expect(resolveAppPermissions({})).toBeNull();
		expect(resolveAppPermissions('nope')).toBeNull();
		expect(resolveAppPermissions(null)).toBeNull();
	});
});

describe('can* helpers', () => {
	const send = bits(P.ViewChannel, P.SendMessages);

	test('GIVEN no permissions source THEN returns false', () => {
		expect(canSendMessages(undefined)).toBe(false);
	});

	test('GIVEN Administrator THEN everything is allowed', () => {
		expect(canSendEmbeds({ app_permissions: bits(P.Administrator) })).toBe(true);
	});

	test('canReadMessages needs ViewChannel', () => {
		expect(canReadMessages(bits(P.ViewChannel))).toBe(true);
		expect(canReadMessages('0')).toBe(false);
	});

	test('canSendMessages uses SendMessagesInThreads in threads', () => {
		expect(canSendMessages(send)).toBe(true);
		expect(canSendMessages(send, { id: '1', type: ChannelType.PublicThread })).toBe(false);
		expect(canSendMessages(bits(P.ViewChannel, P.SendMessagesInThreads), { id: '1', type: ChannelType.PublicThread })).toBe(true);
	});

	test('canSendEmbeds and canSendAttachments add their flag', () => {
		expect(canSendEmbeds(send)).toBe(false);
		expect(canSendEmbeds(bits(P.ViewChannel, P.SendMessages, P.EmbedLinks))).toBe(true);
		expect(canSendAttachments(bits(P.ViewChannel, P.SendMessages, P.AttachFiles))).toBe(true);
	});

	test('reaction helpers', () => {
		expect(canReact(bits(P.ViewChannel, P.AddReactions, P.ReadMessageHistory))).toBe(true);
		expect(canReact(bits(P.ViewChannel, P.AddReactions))).toBe(false);
		expect(canRemoveAllReactions(bits(P.ViewChannel, P.ManageMessages))).toBe(true);
	});

	test('canJoinVoiceChannel requires Connect and a voice-based channel', () => {
		const perms = bits(P.ViewChannel, P.Connect);
		expect(canJoinVoiceChannel(perms)).toBe(true);
		expect(canJoinVoiceChannel(perms, { id: '1', type: ChannelType.GuildVoice })).toBe(true);
		expect(canJoinVoiceChannel(perms, { id: '1', type: ChannelType.GuildText })).toBe(false);
	});
});
