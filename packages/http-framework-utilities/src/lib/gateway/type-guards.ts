import {
	GuildMember,
	Message,
	type AnnouncementChannel,
	type AnnouncementThreadChannel,
	type AnyChannel,
	type AnyThreadChannel,
	type CategoryChannel,
	type DMChannel,
	type GroupDMChannel,
	type PrivateThreadChannel,
	type PublicThreadChannel,
	type StageChannel,
	type TextChannel,
	type VoiceChannel
} from '@wolfstar/plugin-gateway';
import { ChannelType } from 'discord-api-types/v10';

type Nullish = null | undefined;

/**
 * The channel structures {@link isTextBasedChannel} accepts: the ones the application can send messages to. Group DMs
 * and stage channels are excluded, matching `@sapphire/discord.js-utilities` and the main entrypoint.
 */
export type TextBasedChannel = AnnouncementChannel | AnyThreadChannel | DMChannel | TextChannel | VoiceChannel;

/**
 * The channel structures {@link isVoiceBasedChannel} accepts.
 */
export type VoiceBasedChannel = StageChannel | VoiceChannel;

/**
 * Every channel structure that belongs to a guild.
 */
export type GuildBasedChannel = Exclude<AnyChannel, DMChannel | GroupDMChannel>;

const ThreadTypes = new Set<ChannelType>([ChannelType.AnnouncementThread, ChannelType.PublicThread, ChannelType.PrivateThread]);
const TextBasedTypes = new Set<ChannelType>([
	ChannelType.GuildText,
	ChannelType.DM,
	ChannelType.GuildAnnouncement,
	ChannelType.GuildVoice,
	...ThreadTypes
]);
const VoiceBasedTypes = new Set<ChannelType>([ChannelType.GuildVoice, ChannelType.GuildStageVoice]);

// Channels compose mixins, so they are told apart by their `type` getter rather than with `instanceof`.
function isType<Structure extends AnyChannel>(type: ChannelType) {
	return (channel: AnyChannel | Nullish): channel is Structure => channel?.type === type;
}

export const isCategoryChannel = isType<CategoryChannel>(ChannelType.GuildCategory);
export const isDMChannel = isType<DMChannel>(ChannelType.DM);
export const isGroupChannel = isType<GroupDMChannel>(ChannelType.GroupDM);
export const isNewsChannel = isType<AnnouncementChannel>(ChannelType.GuildAnnouncement);
export const isTextChannel = isType<TextChannel>(ChannelType.GuildText);
export const isVoiceChannel = isType<VoiceChannel>(ChannelType.GuildVoice);
export const isStageChannel = isType<StageChannel>(ChannelType.GuildStageVoice);
export const isNewsThreadChannel = isType<AnnouncementThreadChannel>(ChannelType.AnnouncementThread);
export const isPublicThreadChannel = isType<PublicThreadChannel>(ChannelType.PublicThread);
export const isPrivateThreadChannel = isType<PrivateThreadChannel>(ChannelType.PrivateThread);

/**
 * Whether the channel belongs to a guild, judged by its type: anything but a DM or a group DM.
 */
export function isGuildBasedChannel(channel: AnyChannel | Nullish): channel is GuildBasedChannel {
	return channel != null && channel.type !== ChannelType.DM && channel.type !== ChannelType.GroupDM;
}

/**
 * Whether the value carries a non-null `guildId`, as every guild channel structure does.
 */
export function isGuildBasedChannelByGuildKey<T extends object>(channel: T | Nullish): channel is T & { guildId: string } {
	return channel != null && 'guildId' in channel && channel.guildId != null;
}

export function isThreadChannel(channel: AnyChannel | Nullish): channel is AnyThreadChannel {
	return channel != null && ThreadTypes.has(channel.type);
}

/**
 * Whether the channel can hold messages sent by the application. Group DMs and stage channels are excluded, matching
 * `@sapphire/discord.js-utilities` and the main entrypoint.
 */
export function isTextBasedChannel(channel: AnyChannel | Nullish): channel is TextBasedChannel {
	return channel != null && TextBasedTypes.has(channel.type);
}

export function isVoiceBasedChannel(channel: AnyChannel | Nullish): channel is VoiceBasedChannel {
	return channel != null && VoiceBasedTypes.has(channel.type);
}

/**
 * Whether the channel is age-restricted, read from the structure's `nsfw`. Structures without it (DMs, group DMs,
 * categories) are `false`, and so are threads unless their payload carries the flag, which Discord's does not: the
 * parent channel is not consulted.
 */
export function isNsfwChannel(channel: AnyChannel | Nullish): boolean {
	return channel != null && 'nsfw' in channel && channel.nsfw === true;
}

/**
 * Whether the value is a `@wolfstar/plugin-gateway` {@link Message} structure, as opposed to a raw `APIMessage`.
 */
export function isMessageInstance(value: unknown): value is Message {
	return value instanceof Message;
}

/**
 * Whether the value is a `@wolfstar/plugin-gateway` {@link GuildMember} structure, as opposed to a raw member payload.
 */
export function isGuildMember(value: unknown): value is GuildMember {
	return value instanceof GuildMember;
}
