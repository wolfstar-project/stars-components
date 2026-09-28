import {
	ChannelType,
	ComponentType,
	InteractionType,
	type APIAttachment,
	type APIMessageButtonInteractionData,
	type APIMessageChannelSelectInteractionData,
	type APIMessageComponentInteractionData,
	type APIMessageMentionableSelectInteractionData,
	type APIMessageRoleSelectInteractionData,
	type APIMessageStringSelectInteractionData,
	type APIMessageUserSelectInteractionData
} from 'discord-api-types/v10';

export type Nullish = null | undefined;

/**
 * The minimal shape shared by every raw channel payload (`APIChannel`, `APIInteractionDataResolvedChannel`, and the
 * interaction's `channel`).
 */
export interface ChannelLike {
	id: string;
	type: ChannelType;
	nsfw?: boolean;
}

type Narrow<T, Type extends ChannelType> = T & { type: Type };

const ThreadTypes = new Set<ChannelType>([ChannelType.AnnouncementThread, ChannelType.PublicThread, ChannelType.PrivateThread]);
const TextBasedTypes = new Set<ChannelType>([
	ChannelType.GuildText,
	ChannelType.DM,
	ChannelType.GuildAnnouncement,
	ChannelType.GuildVoice,
	...ThreadTypes
]);
const VoiceBasedTypes = new Set<ChannelType>([ChannelType.GuildVoice, ChannelType.GuildStageVoice]);

function isType<Type extends ChannelType>(type: Type) {
	return <T extends ChannelLike>(channel: T | Nullish): channel is Narrow<T, Type> => channel?.type === type;
}

export const isCategoryChannel = isType(ChannelType.GuildCategory);
export const isDMChannel = isType(ChannelType.DM);
export const isGroupChannel = isType(ChannelType.GroupDM);
export const isNewsChannel = isType(ChannelType.GuildAnnouncement);
export const isTextChannel = isType(ChannelType.GuildText);
export const isVoiceChannel = isType(ChannelType.GuildVoice);
export const isStageChannel = isType(ChannelType.GuildStageVoice);
export const isNewsThreadChannel = isType(ChannelType.AnnouncementThread);
export const isPublicThreadChannel = isType(ChannelType.PublicThread);
export const isPrivateThreadChannel = isType(ChannelType.PrivateThread);

export function isGuildBasedChannel<T extends ChannelLike>(
	channel: T | Nullish
): channel is Narrow<T, Exclude<ChannelType, ChannelType.DM | ChannelType.GroupDM>> {
	return channel != null && channel.type !== ChannelType.DM && channel.type !== ChannelType.GroupDM;
}

export function isThreadChannel<T extends ChannelLike>(
	channel: T | Nullish
): channel is Narrow<T, ChannelType.AnnouncementThread | ChannelType.PublicThread | ChannelType.PrivateThread> {
	return channel != null && ThreadTypes.has(channel.type);
}

/**
 * Whether the channel can hold messages sent by the application. Group DMs and stage channels are excluded, matching
 * `@sapphire/discord.js-utilities`.
 */
export function isTextBasedChannel<T extends ChannelLike>(channel: T | Nullish): channel is T {
	return channel != null && TextBasedTypes.has(channel.type);
}

export function isVoiceBasedChannel<T extends ChannelLike>(
	channel: T | Nullish
): channel is Narrow<T, ChannelType.GuildVoice | ChannelType.GuildStageVoice> {
	return channel != null && VoiceBasedTypes.has(channel.type);
}

/**
 * Whether the channel is age-restricted. Raw payloads do not carry a thread's parent, so threads return `false`.
 */
export function isNsfwChannel(channel: ChannelLike | Nullish): boolean {
	if (channel == null || ThreadTypes.has(channel.type)) return false;
	return channel.nsfw === true;
}

/**
 * Whether the value is a full guild member (`APIGuildMember` / `APIInteractionGuildMember`), as opposed to a resolved
 * member from interaction data, which lacks `user`.
 */
export function isGuildMember(member: object | Nullish): member is { user: { id: string }; roles: string[]; joined_at: string } {
	return member != null && 'user' in member && 'roles' in member && 'joined_at' in member;
}

const InteractionTypes = new Set<number>(Object.values(InteractionType).filter((value) => typeof value === 'number'));
const InteractableTypes = new Set<number>([InteractionType.ApplicationCommand, InteractionType.MessageComponent, InteractionType.ModalSubmit]);

/**
 * Whether the value is an interaction, either a raw payload or an `@wolfstar/http-framework` interaction structure.
 */
export function isAnyInteraction(value: unknown): value is { type: InteractionType; token: string; application_id: string } {
	if (typeof value !== 'object' || value === null) return false;
	const { type, token } = value as { type?: unknown; token?: unknown };
	return typeof type === 'number' && InteractionTypes.has(type) && typeof token === 'string' && 'application_id' in value;
}

/**
 * Whether the interaction can be responded to with a message: application commands, message components, and modal
 * submissions. Pings and autocomplete are excluded.
 */
export function isAnyInteractableInteraction<T extends { type: InteractionType }>(interaction: T | Nullish): interaction is T {
	return interaction != null && InteractableTypes.has(interaction.type);
}

export function isImageAttachment(attachment: Pick<APIAttachment, 'content_type'>): boolean {
	return attachment.content_type?.startsWith('image/') ?? false;
}

export function isMediaAttachment(attachment: Pick<APIAttachment, 'content_type'>): boolean {
	const type = attachment.content_type;
	return type !== undefined && (type.startsWith('image/') || type.startsWith('video/'));
}

export function isMessageButtonInteractionData(data: APIMessageComponentInteractionData): data is APIMessageButtonInteractionData {
	return data.component_type === ComponentType.Button;
}

export function isMessageStringSelectInteractionData(data: APIMessageComponentInteractionData): data is APIMessageStringSelectInteractionData {
	return data.component_type === ComponentType.StringSelect;
}

export function isMessageUserSelectInteractionData(data: APIMessageComponentInteractionData): data is APIMessageUserSelectInteractionData {
	return data.component_type === ComponentType.UserSelect;
}

export function isMessageRoleSelectInteractionData(data: APIMessageComponentInteractionData): data is APIMessageRoleSelectInteractionData {
	return data.component_type === ComponentType.RoleSelect;
}

export function isMessageMentionableSelectInteractionData(
	data: APIMessageComponentInteractionData
): data is APIMessageMentionableSelectInteractionData {
	return data.component_type === ComponentType.MentionableSelect;
}

export function isMessageChannelSelectInteractionData(data: APIMessageComponentInteractionData): data is APIMessageChannelSelectInteractionData {
	return data.component_type === ComponentType.ChannelSelect;
}
