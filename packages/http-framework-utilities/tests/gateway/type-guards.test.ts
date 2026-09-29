import { ChannelType } from 'discord-api-types/v10';
import type { AnyThreadChannel, GuildMember, Message, TextChannel, VoiceChannel, StageChannel } from '@wolfstar/plugin-gateway';
import {
	isCategoryChannel,
	isDMChannel,
	isGroupChannel,
	isGuildBasedChannel,
	isGuildBasedChannelByGuildKey,
	isGuildMember,
	isMessageInstance,
	isNewsChannel,
	isNewsThreadChannel,
	isNsfwChannel,
	isPrivateThreadChannel,
	isPublicThreadChannel,
	isStageChannel,
	isTextBasedChannel,
	isTextChannel,
	isThreadChannel,
	isVoiceBasedChannel,
	isVoiceChannel
} from '../../src/gateway.js';
import { createGatewayChannel, createGatewayMember, createGatewayMessage, createGatewayUser, rawMember, rawMessage } from './helpers.js';

const channel = createGatewayChannel;

describe('gateway channel guards', () => {
	const exact = [
		[isCategoryChannel, ChannelType.GuildCategory, ChannelType.GuildText],
		[isDMChannel, ChannelType.DM, ChannelType.GroupDM],
		[isGroupChannel, ChannelType.GroupDM, ChannelType.DM],
		[isNewsChannel, ChannelType.GuildAnnouncement, ChannelType.GuildText],
		[isTextChannel, ChannelType.GuildText, ChannelType.GuildAnnouncement],
		[isVoiceChannel, ChannelType.GuildVoice, ChannelType.GuildStageVoice],
		[isStageChannel, ChannelType.GuildStageVoice, ChannelType.GuildVoice],
		[isNewsThreadChannel, ChannelType.AnnouncementThread, ChannelType.PublicThread],
		[isPublicThreadChannel, ChannelType.PublicThread, ChannelType.PrivateThread],
		[isPrivateThreadChannel, ChannelType.PrivateThread, ChannelType.PublicThread]
	] as const;

	test.each(exact)('GIVEN %o THEN it matches its type only', (guard, match, other) => {
		expect(guard(channel(match))).toBe(true);
		expect(guard(channel(other))).toBe(false);
		expect(guard(null)).toBe(false);
		expect(guard(undefined)).toBe(false);
	});

	test('GIVEN guild and DM channels THEN isGuildBasedChannel matches guild channels only', () => {
		expect(isGuildBasedChannel(channel(ChannelType.GuildText))).toBe(true);
		expect(isGuildBasedChannel(channel(ChannelType.PublicThread))).toBe(true);
		expect(isGuildBasedChannel(channel(ChannelType.GuildForum))).toBe(true);
		expect(isGuildBasedChannel(channel(ChannelType.DM))).toBe(false);
		expect(isGuildBasedChannel(channel(ChannelType.GroupDM))).toBe(false);
		expect(isGuildBasedChannel(null)).toBe(false);
	});

	test('GIVEN channels THEN isGuildBasedChannelByGuildKey checks guildId', () => {
		expect(isGuildBasedChannelByGuildKey(channel(ChannelType.GuildText))).toBe(true);
		expect(isGuildBasedChannelByGuildKey(channel(ChannelType.DM))).toBe(false);
		expect(isGuildBasedChannelByGuildKey(channel(ChannelType.GroupDM))).toBe(false);
		expect(isGuildBasedChannelByGuildKey({ guildId: null })).toBe(false);
		expect(isGuildBasedChannelByGuildKey(undefined)).toBe(false);
	});

	test('GIVEN threads and non-threads THEN isThreadChannel matches threads', () => {
		expect(isThreadChannel(channel(ChannelType.AnnouncementThread))).toBe(true);
		expect(isThreadChannel(channel(ChannelType.PublicThread))).toBe(true);
		expect(isThreadChannel(channel(ChannelType.PrivateThread))).toBe(true);
		expect(isThreadChannel(channel(ChannelType.GuildText))).toBe(false);
		expect(isThreadChannel(null)).toBe(false);
	});

	test('GIVEN channels THEN isTextBasedChannel follows the HTTP entry', () => {
		for (const type of [
			ChannelType.GuildText,
			ChannelType.DM,
			ChannelType.GuildAnnouncement,
			ChannelType.GuildVoice,
			ChannelType.AnnouncementThread,
			ChannelType.PublicThread,
			ChannelType.PrivateThread
		]) {
			expect(isTextBasedChannel(channel(type))).toBe(true);
		}

		for (const type of [
			ChannelType.GroupDM,
			ChannelType.GuildStageVoice,
			ChannelType.GuildCategory,
			ChannelType.GuildForum,
			ChannelType.GuildMedia
		]) {
			expect(isTextBasedChannel(channel(type))).toBe(false);
		}

		expect(isTextBasedChannel(undefined)).toBe(false);
	});

	test('GIVEN channels THEN isVoiceBasedChannel matches voice and stage', () => {
		expect(isVoiceBasedChannel(channel(ChannelType.GuildVoice))).toBe(true);
		expect(isVoiceBasedChannel(channel(ChannelType.GuildStageVoice))).toBe(true);
		expect(isVoiceBasedChannel(channel(ChannelType.GuildText))).toBe(false);
		expect(isVoiceBasedChannel(null)).toBe(false);
	});

	test('GIVEN channels THEN isNsfwChannel reads the nsfw flag', () => {
		expect(isNsfwChannel(channel(ChannelType.GuildText, { nsfw: true }))).toBe(true);
		expect(isNsfwChannel(channel(ChannelType.GuildText, { nsfw: false }))).toBe(false);
		expect(isNsfwChannel(channel(ChannelType.GuildText))).toBe(false);
		expect(isNsfwChannel(channel(ChannelType.DM))).toBe(false);
		expect(isNsfwChannel(channel(ChannelType.GuildCategory))).toBe(false);
		expect(isNsfwChannel(channel(ChannelType.PublicThread))).toBe(false);
		expect(isNsfwChannel(null)).toBe(false);
	});

	test('GIVEN a channel THEN the guards narrow to plugin-gateway structures', () => {
		const value = channel(ChannelType.GuildText);
		if (isTextChannel(value)) expectTypeOf(value).toEqualTypeOf<TextChannel>();
		if (isThreadChannel(value)) expectTypeOf(value).toEqualTypeOf<AnyThreadChannel>();
		if (isVoiceBasedChannel(value)) expectTypeOf(value).toEqualTypeOf<VoiceChannel | StageChannel>();
	});
});

describe('gateway structure guards', () => {
	test('GIVEN a Message structure THEN isMessageInstance is true', () => {
		const message = createGatewayMessage();
		expect(isMessageInstance(message)).toBe(true);
		if (isMessageInstance(message)) expectTypeOf(message).toEqualTypeOf<Message>();
	});

	test('GIVEN a raw APIMessage or anything else THEN isMessageInstance is false', () => {
		expect(isMessageInstance(rawMessage())).toBe(false);
		expect(isMessageInstance(createGatewayMember())).toBe(false);
		expect(isMessageInstance(null)).toBe(false);
		expect(isMessageInstance(undefined)).toBe(false);
	});

	test('GIVEN a GuildMember structure THEN isGuildMember is true', () => {
		const member = createGatewayMember();
		expect(isGuildMember(member)).toBe(true);
		if (isGuildMember(member)) expectTypeOf(member).toEqualTypeOf<GuildMember>();
	});

	test('GIVEN a raw member, a user, or nullish THEN isGuildMember is false', () => {
		expect(isGuildMember(rawMember())).toBe(false);
		expect(isGuildMember(createGatewayUser())).toBe(false);
		expect(isGuildMember(null)).toBe(false);
		expect(isGuildMember(undefined)).toBe(false);
	});
});
