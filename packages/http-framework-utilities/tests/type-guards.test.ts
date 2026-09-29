import { ChannelType, ComponentType, InteractionType } from 'discord-api-types/v10';
import {
	isAnyInteractableInteraction,
	isAnyInteraction,
	isDMChannel,
	isGuildBasedChannel,
	isGuildMember,
	isImageAttachment,
	isMediaAttachment,
	isMessageButtonInteractionData,
	isMessageStringSelectInteractionData,
	isNsfwChannel,
	isPrivateThreadChannel,
	isStageChannel,
	isTextBasedChannel,
	isTextChannel,
	isThreadChannel,
	isVoiceBasedChannel,
	SnowflakeRegex
} from '../src/index.js';

const channel = (type: ChannelType, extra: Record<string, unknown> = {}) => ({ id: '1', type, ...extra });

describe('channel guards', () => {
	test('GIVEN nullish THEN every guard returns false', () => {
		expect(isTextChannel(null)).toBe(false);
		expect(isGuildBasedChannel(undefined)).toBe(false);
		expect(isNsfwChannel(null)).toBe(false);
	});

	test('GIVEN specific types THEN guards match exactly', () => {
		expect(isTextChannel(channel(ChannelType.GuildText))).toBe(true);
		expect(isTextChannel(channel(ChannelType.GuildAnnouncement))).toBe(false);
		expect(isDMChannel(channel(ChannelType.DM))).toBe(true);
		expect(isStageChannel(channel(ChannelType.GuildStageVoice))).toBe(true);
		expect(isPrivateThreadChannel(channel(ChannelType.PrivateThread))).toBe(true);
	});

	test('GIVEN groups of types THEN group guards match', () => {
		expect(isGuildBasedChannel(channel(ChannelType.GuildText))).toBe(true);
		expect(isGuildBasedChannel(channel(ChannelType.DM))).toBe(false);
		expect(isGuildBasedChannel(channel(ChannelType.GroupDM))).toBe(false);
		expect(isThreadChannel(channel(ChannelType.AnnouncementThread))).toBe(true);
		expect(isTextBasedChannel(channel(ChannelType.GuildVoice))).toBe(true);
		expect(isTextBasedChannel(channel(ChannelType.GuildStageVoice))).toBe(false);
		expect(isTextBasedChannel(channel(ChannelType.GuildCategory))).toBe(false);
		expect(isVoiceBasedChannel(channel(ChannelType.GuildStageVoice))).toBe(true);
	});

	test('GIVEN a channel THEN isTextBasedChannel narrows the type', () => {
		const c = channel(ChannelType.GuildVoice);
		if (isTextBasedChannel(c)) {
			expectTypeOf(c.type).toEqualTypeOf<
				| ChannelType.GuildText
				| ChannelType.DM
				| ChannelType.GuildAnnouncement
				| ChannelType.GuildVoice
				| ChannelType.AnnouncementThread
				| ChannelType.PublicThread
				| ChannelType.PrivateThread
			>();
		}
	});

	test('GIVEN nsfw flag THEN isNsfwChannel reads it', () => {
		expect(isNsfwChannel(channel(ChannelType.GuildText, { nsfw: true }))).toBe(true);
		expect(isNsfwChannel(channel(ChannelType.GuildText))).toBe(false);
	});
});

describe('other guards', () => {
	test('isGuildMember distinguishes full members from resolved members', () => {
		expect(isGuildMember({ user: { id: '1' }, roles: [], joined_at: '2020-01-01' })).toBe(true);
		expect(isGuildMember({ roles: [], joined_at: '2020-01-01', permissions: '0' })).toBe(false);
		expect(isGuildMember(null)).toBe(false);
	});

	test('interaction guards', () => {
		expect(isAnyInteraction({ type: InteractionType.Ping, token: 't', application_id: '1' })).toBe(true);
		expect(isAnyInteraction({ type: 99, token: 't', application_id: '1' })).toBe(false);
		expect(isAnyInteraction('nope')).toBe(false);
		expect(isAnyInteractableInteraction({ type: InteractionType.MessageComponent })).toBe(true);
		expect(isAnyInteractableInteraction({ type: InteractionType.ApplicationCommandAutocomplete })).toBe(false);
		expect(isAnyInteractableInteraction({ type: InteractionType.Ping })).toBe(false);
	});

	test('attachment guards', () => {
		expect(isImageAttachment({ content_type: 'image/png' })).toBe(true);
		expect(isImageAttachment({ content_type: 'video/mp4' })).toBe(false);
		expect(isMediaAttachment({ content_type: 'video/mp4' })).toBe(true);
		expect(isMediaAttachment({})).toBe(false);
	});

	test('component data guards', () => {
		expect(isMessageButtonInteractionData({ component_type: ComponentType.Button, custom_id: 'a' })).toBe(true);
		expect(isMessageStringSelectInteractionData({ component_type: ComponentType.StringSelect, custom_id: 'a', values: [] })).toBe(true);
		expect(isMessageStringSelectInteractionData({ component_type: ComponentType.Button, custom_id: 'a' })).toBe(false);
	});

	test('re-exports @wolfstar/discord-utilities', () => {
		expect(SnowflakeRegex).toBeInstanceOf(RegExp);
	});
});
