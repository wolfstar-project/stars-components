import { container } from '@wolfstar/http-framework';
import { PermissionsBitField } from '@wolfstar/plugin-gateway';
import { ChannelType, PermissionFlagsBits as P } from 'discord-api-types/v10';
import {
	canJoinVoiceChannel,
	canReact,
	canReadMessages,
	canRemoveAllReactions,
	canSendAttachments,
	canSendEmbeds,
	canSendMessages
} from '../../src/gateway.js';
import { setPermissionsResolver, type PermissionsResolver } from '../../src/lib/gateway/permissions.js';
import { createGatewayChannel } from './helpers.js';

const BotId = '100000000000000042';
const bits = (...flags: bigint[]) => flags.reduce((a, b) => a | b, 0n);

describe('gateway permission helpers', () => {
	let previousClient: unknown;
	let resolver: ReturnType<typeof vi.fn<PermissionsResolver>>;

	function grant(...flags: bigint[]) {
		resolver.mockResolvedValue(new PermissionsBitField(bits(...flags)));
	}

	beforeEach(() => {
		previousClient = container.client;
		// `getGatewayClient()` accepts any `container.client` carrying a `gateway`.
		container.client = { gateway: {}, user: { id: BotId } } as never;
		resolver = vi.fn<PermissionsResolver>();
		setPermissionsResolver(resolver);
	});

	afterEach(() => {
		container.client = previousClient as never;
		setPermissionsResolver();
	});

	const text = () => createGatewayChannel(ChannelType.GuildText);

	test('GIVEN a guild channel THEN computes the bot permissions in it', async () => {
		grant(P.ViewChannel);
		const channel = text();
		await expect(canReadMessages(channel)).resolves.toBe(true);
		expect(resolver).toHaveBeenCalledWith(channel, BotId);
	});

	test('GIVEN missing bits THEN resolves false', async () => {
		grant(P.ViewChannel);
		await expect(canSendMessages(text())).resolves.toBe(false);
		grant(P.ViewChannel, P.SendMessages);
		await expect(canSendMessages(text())).resolves.toBe(true);
		await expect(canSendEmbeds(text())).resolves.toBe(false);
		await expect(canSendAttachments(text())).resolves.toBe(false);
		grant(P.ViewChannel, P.SendMessages, P.EmbedLinks, P.AttachFiles);
		await expect(canSendEmbeds(text())).resolves.toBe(true);
		await expect(canSendAttachments(text())).resolves.toBe(true);
	});

	test('canReact and canRemoveAllReactions need their bits', async () => {
		grant(P.ViewChannel, P.AddReactions);
		await expect(canReact(text())).resolves.toBe(false);
		grant(P.ViewChannel, P.AddReactions, P.ReadMessageHistory);
		await expect(canReact(text())).resolves.toBe(true);
		await expect(canRemoveAllReactions(text())).resolves.toBe(false);
		grant(P.ViewChannel, P.ManageMessages);
		await expect(canRemoveAllReactions(text())).resolves.toBe(true);
	});

	test('GIVEN a thread THEN sending needs SendMessagesInThreads', async () => {
		const thread = createGatewayChannel(ChannelType.PublicThread);
		grant(P.ViewChannel, P.SendMessages);
		await expect(canSendMessages(thread)).resolves.toBe(false);
		grant(P.ViewChannel, P.SendMessagesInThreads);
		await expect(canSendMessages(thread)).resolves.toBe(true);
	});

	test('GIVEN Administrator THEN everything is allowed', async () => {
		grant(P.Administrator);
		await expect(canSendEmbeds(text())).resolves.toBe(true);
		await expect(canRemoveAllReactions(text())).resolves.toBe(true);
		await expect(canJoinVoiceChannel(createGatewayChannel(ChannelType.GuildVoice))).resolves.toBe(true);
	});

	test.each([ChannelType.DM, ChannelType.GroupDM])('GIVEN a DM channel (%i) THEN shortcuts without computing', async (type) => {
		const dm = createGatewayChannel(type);
		await expect(canReadMessages(dm)).resolves.toBe(true);
		await expect(canSendMessages(dm)).resolves.toBe(true);
		await expect(canSendEmbeds(dm)).resolves.toBe(true);
		await expect(canSendAttachments(dm)).resolves.toBe(true);
		await expect(canReact(dm)).resolves.toBe(true);
		await expect(canRemoveAllReactions(dm)).resolves.toBe(false);
		await expect(canJoinVoiceChannel(dm)).resolves.toBe(false);
		expect(resolver).not.toHaveBeenCalled();
	});

	test('canJoinVoiceChannel needs a voice-based channel and Connect', async () => {
		grant(P.ViewChannel, P.Connect);
		await expect(canJoinVoiceChannel(text())).resolves.toBe(false);
		await expect(canJoinVoiceChannel(createGatewayChannel(ChannelType.GuildVoice))).resolves.toBe(true);
		await expect(canJoinVoiceChannel(createGatewayChannel(ChannelType.GuildStageVoice))).resolves.toBe(true);
		grant(P.ViewChannel);
		await expect(canJoinVoiceChannel(createGatewayChannel(ChannelType.GuildVoice))).resolves.toBe(false);
	});

	test('GIVEN no channel THEN resolves false', async () => {
		grant(P.Administrator);
		await expect(canSendMessages(null)).resolves.toBe(false);
		await expect(canReadMessages(undefined)).resolves.toBe(false);
	});

	test('GIVEN no bot user THEN resolves false', async () => {
		grant(P.Administrator);
		container.client = { gateway: {}, user: null } as never;
		await expect(canSendMessages(text())).resolves.toBe(false);
		expect(resolver).not.toHaveBeenCalled();
	});

	test('GIVEN no gateway client THEN resolves false', async () => {
		grant(P.Administrator);
		container.client = { emit: () => true } as never;
		await expect(canSendMessages(text())).resolves.toBe(false);
	});

	test('GIVEN the resolver throws THEN resolves false and logs at debug only', async () => {
		resolver.mockRejectedValue(new Error('Unknown Channel'));
		const debug = vi.spyOn(container.logger, 'debug').mockImplementation(() => undefined);
		const error = vi.spyOn(container.logger, 'error');
		try {
			await expect(canSendMessages(text())).resolves.toBe(false);
			expect(debug).toHaveBeenCalledOnce();
			expect(error).not.toHaveBeenCalled();
		} finally {
			debug.mockRestore();
			error.mockRestore();
		}
	});
});
