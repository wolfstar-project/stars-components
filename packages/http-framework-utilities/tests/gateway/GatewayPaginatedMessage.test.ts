import { container } from '@wolfstar/http-framework';
import { MessagePayload, type TextChannel } from '@wolfstar/plugin-gateway';
import { ChannelType, ComponentType, Routes, type APIActionRowComponent, type APIComponentInMessageActionRow } from 'discord-api-types/v10';
import { GatewayPaginatedMessage } from '../../src/gateway.js';
import {
	cancelCleanup,
	encodeCustomId,
	getSessionStore,
	MaximumTokenLifetime,
	PaginatedMessageHandlerName,
	type PaginatedMessageSession
} from '../../src/index.js';
import { handlePaginatedMessageInteraction } from '../../src/lib/PaginatedMessage/handle.js';
import { clickButton, useMemorySessionStore } from '../helpers.js';
import { ChannelId, createGatewayChannel, createGatewayMessage, MessageId, UserId, type FakeGatewayClient } from './helpers.js';

const CreatedId = '100000000000000050';
const OtherUserId = '100000000000000051';
const Idle = 20 * 60_000;

type Rows = APIActionRowComponent<APIComponentInMessageActionRow>[];

const pmId = (sessionId: string, action: string) => encodeCustomId(PaginatedMessageHandlerName, sessionId, action);

function customIds(components: Rows): string[] {
	return components.flatMap((row) => row.components.map((component) => ('custom_id' in component ? component.custom_id : '')));
}

function allDisabled(components: Rows): boolean {
	return components.length > 0 && components.flatMap((row) => row.components).every((component) => component.disabled === true);
}

function paginated(idle = Idle) {
	return new GatewayPaginatedMessage({ idle }).addPageContent('page 1').addPageContent('page 2');
}

async function getSession(sessionId: string): Promise<PaginatedMessageSession> {
	return (await getSessionStore().get(sessionId)) as PaginatedMessageSession;
}

useMemorySessionStore();

const sessionIds: string[] = [];
function track(sessionId: string): string {
	sessionIds.push(sessionId);
	return sessionId;
}

let previousRest: typeof container.rest;
let post: ReturnType<typeof vi.fn>;
let patch: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.useFakeTimers();
	previousRest = container.rest;
	post = vi.fn(async () => ({ id: CreatedId, channel_id: ChannelId }));
	patch = vi.fn(async () => ({}));
	// No real REST client in tests: nothing ever reaches Discord.
	container.rest = { post, patch, get: async () => ({}) } as unknown as typeof container.rest;
});

afterEach(() => {
	for (const sessionId of sessionIds.splice(0)) cancelCleanup(sessionId);
	vi.useRealTimers();
	vi.restoreAllMocks();
	container.rest = previousRest;
});

/**
 * A gateway message bound to a fake client whose `messages.send` records the payload `Message#reply` builds.
 */
function replyTarget(overrides: Parameters<typeof createGatewayMessage>[0] = {}) {
	const send = vi.fn(async (_channelId: string, _payload: MessagePayload) => createGatewayMessage({ id: CreatedId }));
	const client: FakeGatewayClient = { messages: { send } as never, options: {} as never };
	return { message: createGatewayMessage(overrides, client), send };
}

describe('GatewayPaginatedMessage', () => {
	test('GIVEN an interaction THEN replies to it like PaginatedMessage', async () => {
		const interaction = { user: { id: UserId }, reply: vi.fn(async (_data: unknown) => undefined) };
		const sessionId = track(await paginated(1000).run(interaction));

		expect(interaction.reply).toHaveBeenCalledOnce();
		const payload = interaction.reply.mock.calls[0]![0] as { content: string; components: Rows };
		expect(payload.content).toBe('page 1');
		expect(customIds(payload.components)).toContain(pmId(sessionId, 'next'));
		expect((await getSession(sessionId)).ownerId).toBe(UserId);
		expect(post).not.toHaveBeenCalled();
	});

	test('GIVEN an interaction and an idle above the token lifetime without a channel THEN still rejects', async () => {
		const interaction = { user: { id: UserId }, reply: vi.fn(async (_data: unknown) => undefined) };
		await expect(paginated().run(interaction)).rejects.toThrow(RangeError);
		expect(interaction.reply).not.toHaveBeenCalled();
	});

	describe('GIVEN a gateway message', () => {
		test('THEN replies to it with the first page and the components, owned by its author', async () => {
			const { message, send } = replyTarget();
			const sessionId = track(await paginated().run(message));

			expect(send).toHaveBeenCalledOnce();
			const [channelId, payload] = send.mock.calls[0]!;
			expect(channelId).toBe(ChannelId);
			const { body } = payload.resolveBody();
			expect(body!.content).toBe('page 1');
			expect(customIds(body!.components as Rows)).toContain(pmId(sessionId, 'next'));
			expect(body!.message_reference).toMatchObject({ message_id: MessageId, channel_id: ChannelId });
			expect(post).not.toHaveBeenCalled();

			const session = await getSession(sessionId);
			expect(session.ownerId).toBe(UserId);
			expect(session.maximumExpiresAt).toBeNull();
		});

		test('WITH an explicit author THEN the author owns the session', async () => {
			const { message } = replyTarget();
			const sessionId = track(await paginated().run(message, { id: OtherUserId }));
			expect((await getSession(sessionId)).ownerId).toBe(OtherUserId);
		});

		test('WITH allowed mentions on the page THEN they are kept', async () => {
			const { message, send } = replyTarget();
			track(await new GatewayPaginatedMessage().addPage({ content: 'a', allowed_mentions: { parse: [] } }).run(message));

			const { body } = send.mock.calls[0]![1].resolveBody();
			expect(body!.allowed_mentions).toEqual({ parse: [] });
		});

		test('WITH an idle above the token lifetime THEN edits the reply through the bot REST route on timeout', async () => {
			const { message } = replyTarget();
			track(await paginated().run(message));

			await vi.advanceTimersByTimeAsync(Idle - 1);
			expect(patch).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(1);

			expect(patch).toHaveBeenCalledOnce();
			const [route, options] = patch.mock.calls[0]! as [string, { body: { components: Rows }; auth?: boolean }];
			expect(route).toBe(Routes.channelMessage(ChannelId, CreatedId));
			expect(options).not.toHaveProperty('auth');
			expect(allDisabled(options.body.components)).toBe(true);
		});

		test('WHEN the reply fails THEN rejects and schedules no cleanup', async () => {
			const { message, send } = replyTarget();
			send.mockRejectedValueOnce(new Error('Missing Permissions'));

			await expect(paginated(1000).run(message)).rejects.toThrow('Missing Permissions');
			await vi.advanceTimersByTimeAsync(5000);
			expect(patch).not.toHaveBeenCalled();
		});
	});

	describe('GIVEN a text-based channel', () => {
		const channel = () => createGatewayChannel(ChannelType.GuildText) as TextChannel;

		test('THEN posts the first page and the components to it, usable by anyone', async () => {
			const sessionId = track(await paginated().run(channel()));

			expect(post).toHaveBeenCalledOnce();
			const [route, options] = post.mock.calls[0]! as [string, { body: { content: string; components: Rows } }];
			expect(route).toBe(Routes.channelMessages(ChannelId));
			expect(options.body.content).toBe('page 1');
			expect(customIds(options.body.components)).toContain(pmId(sessionId, 'next'));
			expect(options.body.components[0]!.type).toBe(ComponentType.ActionRow);
			expect((await getSession(sessionId)).ownerId).toBeNull();
		});

		test('WITH an author THEN the author owns the session', async () => {
			const sessionId = track(await paginated().run(channel(), { id: OtherUserId }));
			expect((await getSession(sessionId)).ownerId).toBe(OtherUserId);
		});

		test('WITH an idle above the token lifetime THEN edits the message through the bot REST route on timeout', async () => {
			track(await paginated().run(channel()));
			expect(Idle).toBeGreaterThan(MaximumTokenLifetime);

			await vi.advanceTimersByTimeAsync(Idle);
			expect(patch).toHaveBeenCalledOnce();
			const [route, options] = patch.mock.calls[0]! as [string, { body: { components: Rows }; auth?: boolean }];
			expect(route).toBe(Routes.channelMessage(ChannelId, CreatedId));
			expect(options).not.toHaveProperty('auth');
			expect(allDisabled(options.body.components)).toBe(true);
		});

		test('WHEN a click arrives THEN the HTTP handler navigates and pushes the cleanup back', async () => {
			const sessionId = track(await paginated(1000).run(channel()));

			await vi.advanceTimersByTimeAsync(800);
			const click = clickButton(pmId(sessionId, 'next'));
			await handlePaginatedMessageInteraction(click.interaction, click.value);
			expect((await getSession(sessionId)).index).toBe(1);

			await vi.advanceTimersByTimeAsync(900);
			expect(patch).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(100);
			expect(patch).toHaveBeenCalledOnce();
			expect(patch.mock.calls[0]![0]).toBe(Routes.channelMessage(ChannelId, CreatedId));
		});
	});
});
