/**
 * Builders for `@wolfstar/plugin-gateway` structures, shared by the gateway tests.
 *
 * Approach: structures are built from raw payloads through plugin-gateway's own public constructors, exactly the way
 * its managers do (`createChannel(data)` picks the channel class from `type`, `new Message(data)`,
 * `new GuildMember(data)`, `new User(data)`). Constructing a structure touches no client: `structure.client` is
 * resolved lazily (the bound client, else `getGatewayClient()` from `container.client`). Tests that need actions or
 * relations pass a fake client, which is bound with plugin-gateway's `bindClient` so no global `container.client` is
 * required. No gateway connection is ever opened.
 */
import { bindClient, createChannel, GuildMember, Message, User, type AnyChannel, type GatewayClient } from '@wolfstar/plugin-gateway';
import { ChannelType, MessageType, type APIGuildMember, type APIMessage, type APIUser } from 'discord-api-types/v10';

export const GuildId = '100000000000000001';
export const ChannelId = '100000000000000002';
export const UserId = '100000000000000003';
export const MessageId = '100000000000000004';

/**
 * A fake client, cast to `GatewayClient`: only the members a test touches need to exist on it.
 */
export type FakeGatewayClient = Partial<GatewayClient> & Record<string, unknown>;

function bind<T extends object>(structure: T, client?: FakeGatewayClient): T {
	return client === undefined ? structure : bindClient(structure, client as unknown as GatewayClient);
}

const DMTypes = new Set<ChannelType>([ChannelType.DM, ChannelType.GroupDM]);
const ThreadTypes = new Set<ChannelType>([ChannelType.AnnouncementThread, ChannelType.PublicThread, ChannelType.PrivateThread]);

/**
 * Builds the channel structure plugin-gateway's `ChannelManager` would for a raw channel of this type. Guild channels
 * get `guild_id`, DMs get a recipient, threads get a parent and thread metadata.
 */
export function createGatewayChannel(type: ChannelType, overrides: Record<string, unknown> = {}, client?: FakeGatewayClient): AnyChannel {
	const data: Record<string, unknown> = { id: ChannelId, type, name: `channel-${type}` };
	if (DMTypes.has(type)) {
		data.recipients = [rawUser()];
	} else {
		data.guild_id = GuildId;
		data.position = 0;
		data.permission_overwrites = [];
	}
	if (ThreadTypes.has(type)) {
		data.parent_id = '100000000000000009';
		data.owner_id = UserId;
		data.thread_metadata = { archived: false, auto_archive_duration: 60, archive_timestamp: new Date(0).toISOString(), locked: false };
	}
	return bind(createChannel({ ...data, ...overrides } as Parameters<typeof createChannel>[0]), client);
}

export function rawUser(overrides: Partial<APIUser> = {}): APIUser {
	return { id: UserId, username: 'user', discriminator: '0', global_name: null, avatar: null, ...overrides };
}

export function rawMessage(overrides: Partial<APIMessage> = {}): APIMessage {
	return {
		id: MessageId,
		channel_id: ChannelId,
		author: rawUser(),
		content: 'content',
		timestamp: new Date(0).toISOString(),
		edited_timestamp: null,
		tts: false,
		mention_everyone: false,
		mentions: [],
		mention_roles: [],
		attachments: [],
		embeds: [],
		pinned: false,
		type: MessageType.Default,
		...overrides
	};
}

export function rawMember(overrides: Partial<APIGuildMember> = {}): APIGuildMember & { guild_id: string } {
	return {
		user: rawUser(),
		roles: [],
		joined_at: new Date(0).toISOString(),
		deaf: false,
		mute: false,
		flags: 0,
		guild_id: GuildId,
		...overrides
	} as APIGuildMember & { guild_id: string };
}

export function createGatewayMessage(overrides: Partial<APIMessage> = {}, client?: FakeGatewayClient): Message {
	return bind(new Message(rawMessage(overrides) as ConstructorParameters<typeof Message>[0]), client);
}

export function createGatewayMember(overrides: Partial<APIGuildMember> = {}, client?: FakeGatewayClient): GuildMember {
	return bind(new GuildMember(rawMember(overrides) as ConstructorParameters<typeof GuildMember>[0]), client);
}

export function createGatewayUser(overrides: Partial<APIUser> = {}, client?: FakeGatewayClient): User {
	return bind(new User(rawUser(overrides) as ConstructorParameters<typeof User>[0]), client);
}
