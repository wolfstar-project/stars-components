import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	ChannelType,
	InteractionType,
	type APIApplicationCommandInteractionDataOption,
	type APIChatInputApplicationCommandInteraction,
	type APIInteractionDataResolved,
	type APIUser
} from 'discord-api-types/v10';

export const userId = '266624760782258186';
export const channelId = '737141877803057244';
export const roleId = '737141877803057245';

const user: APIUser = { id: userId, username: 'wolfstar', discriminator: '0', avatar: null, global_name: null };

export const resolved: APIInteractionDataResolved = {
	users: { [userId]: user },
	members: { [userId]: { roles: [roleId], joined_at: '2020-01-01T00:00:00.000Z', permissions: '8', avatar: null, flags: 0 } as any },
	channels: { [channelId]: { id: channelId, name: 'general', type: ChannelType.GuildText, permissions: '8' } as any },
	roles: {
		[roleId]: {
			id: roleId,
			name: 'Moderator',
			color: 0,
			hoist: false,
			position: 1,
			permissions: '8',
			managed: false,
			mentionable: true,
			flags: 0
		} as any
	}
};

const basicOptions: APIApplicationCommandInteractionDataOption[] = [
	{ name: 'target', type: ApplicationCommandOptionType.User, value: userId },
	{ name: 'channel', type: ApplicationCommandOptionType.Channel, value: channelId },
	{ name: 'role', type: ApplicationCommandOptionType.Role, value: roleId },
	{ name: 'mention', type: ApplicationCommandOptionType.Mentionable, value: userId },
	{ name: 'reason', type: ApplicationCommandOptionType.String, value: 'Spamming in multiple channels' },
	{ name: 'duration', type: ApplicationCommandOptionType.Integer, value: 3600 },
	{ name: 'ratio', type: ApplicationCommandOptionType.Number, value: 0.75 },
	{ name: 'silent', type: ApplicationCommandOptionType.Boolean, value: true }
];

/** Options without any subcommand. */
export const flatOptions = basicOptions;

/** Options nested in a subcommand group and a subcommand. */
export const nestedOptions: APIApplicationCommandInteractionDataOption[] = [
	{
		name: 'moderation',
		type: ApplicationCommandOptionType.SubcommandGroup,
		options: [{ name: 'ban', type: ApplicationCommandOptionType.Subcommand, options: basicOptions as any }]
	}
];

export const autocompleteOptions: APIApplicationCommandInteractionDataOption[] = [
	{
		name: 'search',
		type: ApplicationCommandOptionType.Subcommand,
		options: [
			{ name: 'query', type: ApplicationCommandOptionType.String, value: 'wolf', focused: true },
			{ name: 'limit', type: ApplicationCommandOptionType.Integer, value: 25 }
		]
	}
];

export const chatInputInteraction = {
	id: '1',
	application_id: '2',
	token: 't',
	version: 1,
	app_permissions: '8',
	locale: 'en-US',
	entitlements: [],
	authorizing_integration_owners: {},
	attachment_size_limit: 1,
	type: InteractionType.ApplicationCommand,
	channel: { id: channelId, type: ChannelType.GuildText },
	user,
	data: { id: '3', name: 'mod', type: ApplicationCommandType.ChatInput, options: nestedOptions, resolved }
} as unknown as APIChatInputApplicationCommandInteraction;
