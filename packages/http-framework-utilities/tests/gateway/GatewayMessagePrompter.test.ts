import { EventEmitter } from 'node:events';
import { container } from '@wolfstar/http-framework';
import { MessageReaction, type DMChannel, type Message, type MessagePayload, type TextChannel } from '@wolfstar/plugin-gateway';
import { ChannelType, GatewayIntentBits, Routes, type APIActionRowComponent, type APIComponentInMessageActionRow } from 'discord-api-types/v10';
import { GatewayMessagePrompter } from '../../src/gateway.js';
import { MaximumTokenLifetime, RedisSessionStore, setSessionStore } from '../../src/index.js';
import { handleMessagePrompterInteraction } from '../../src/lib/MessagePrompter/handle.js';
import { getPromptWaiters } from '../../src/lib/MessagePrompter/waiters.js';
import { clickButton, useMemorySessionStore } from '../helpers.js';
import {
	ChannelId,
	createGatewayChannel,
	createGatewayMessage,
	createGatewayUser,
	GuildId,
	rawUser,
	UserId,
	type FakeGatewayClient
} from './helpers.js';

const CreatedId = '100000000000000060';
const OtherUserId = '100000000000000061';
const CustomEmojiId = '100000000000000062';
const Long = 20 * 60_000;

const AllIntents =
	GatewayIntentBits.GuildMessages |
	GatewayIntentBits.DirectMessages |
	GatewayIntentBits.MessageContent |
	GatewayIntentBits.GuildMessageReactions |
	GatewayIntentBits.DirectMessageReactions;

type Rows = APIActionRowComponent<APIComponentInMessageActionRow>[];

function customIds(components: Rows | undefined): string[] {
	return (components ?? []).flatMap((row) => row.components.map((component) => ('custom_id' in component ? component.custom_id : '')));
}

useMemorySessionStore();

let emitter: EventEmitter & { gateway: object; options: { intents: number } };
let previousClient: unknown;
let previousRest: typeof container.rest;
let post: ReturnType<typeof vi.fn>;
let patch: ReturnType<typeof vi.fn>;
let put: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.useFakeTimers();
	previousClient = container.client;
	previousRest = container.rest;
	emitter = Object.assign(new EventEmitter(), { gateway: {}, options: { intents: AllIntents } });
	// `getGatewayClient()` accepts any `container.client` carrying a `gateway`.
	container.client = emitter as never;
	post = vi.fn(async () => ({ id: CreatedId, channel_id: ChannelId }));
	patch = vi.fn(async () => ({}));
	put = vi.fn(async () => undefined);
	// No real REST client in tests: nothing ever reaches Discord.
	container.rest = { post, patch, put, get: async () => ({}) } as unknown as typeof container.rest;
});

afterEach(async () => {
	// Settle whatever a test left pending, so no collector or cleanup timer leaks into the next test.
	await vi.advanceTimersByTimeAsync(Long * 2);
	getPromptWaiters().clear();
	vi.useRealTimers();
	vi.restoreAllMocks();
	container.client = previousClient as never;
	container.rest = previousRest;
});

/** Lets the pending sends, intents checks, and listener registrations of a `run` happen. */
async function settle() {
	for (let i = 0; i < 10; i++) await vi.advanceTimersByTimeAsync(0);
}

/**
 * A gateway message in a guild, bound to a fake client whose `messages.send` records the payload `Message#reply` builds.
 */
function replyTarget(overrides: Record<string, unknown> = { guild_id: GuildId }) {
	const send = vi.fn(async (_channelId: string, _payload: MessagePayload) => createGatewayMessage({ id: CreatedId }));
	const client: FakeGatewayClient = { messages: { send } as never, options: {} as never };
	return { message: createGatewayMessage(overrides as never, client), send };
}

function interactionTarget(channelType = ChannelType.GuildText) {
	return {
		user: { id: UserId },
		channel: { id: ChannelId, type: channelType },
		reply: vi.fn(async (_data: unknown) => ({ get: async () => ({ isOk: () => true, unwrap: () => ({ id: CreatedId }) }) }))
	};
}

const textChannel = () => createGatewayChannel(ChannelType.GuildText) as TextChannel;
const dmChannel = () => createGatewayChannel(ChannelType.DM) as DMChannel;

function emitMessage(authorId: string, content = 'answer', channelId = ChannelId): Message {
	const message = createGatewayMessage({
		id: String(BigInt(CreatedId) + 100n),
		channel_id: channelId,
		author: rawUser({ id: authorId }),
		content
	} as never);
	emitter.emit('messageCreate', message);
	return message;
}

function emitReaction(userId: string, emoji: { id: string | null; name: string }, messageId = CreatedId, cached = true) {
	const reaction = new MessageReaction({
		channel_id: ChannelId,
		message_id: messageId,
		emoji,
		me: false,
		me_burst: false,
		burst_colors: []
	} as never);
	// plugin-gateway emits a `null` user when neither the payload nor the cache has it (e.g. DMs without a cache).
	emitter.emit('messageReactionAdd', reaction, cached ? createGatewayUser({ id: userId }) : null, { userId });
}

describe('GatewayMessagePrompter', () => {
	describe('button strategies', () => {
		test('GIVEN an interaction THEN replies with the buttons like MessagePrompter', async () => {
			const interaction = interactionTarget();
			const result = new GatewayMessagePrompter('Sure?').run(interaction);
			await settle();

			const payload = interaction.reply.mock.calls[0]![0] as { content: string; components: Rows };
			expect(payload.content).toBe('Sure?');
			const [yes] = customIds(payload.components);
			const click = clickButton(yes!, UserId);
			await handleMessagePrompterInteraction(click.interaction, click.value);
			await expect(result).resolves.toBe(true);
			expect(post).not.toHaveBeenCalled();
		});

		test('GIVEN an interaction and a timeout above the token lifetime THEN rejects before replying', async () => {
			const interaction = interactionTarget();
			await expect(new GatewayMessagePrompter('Sure?', 'confirm', { timeout: Long }).run(interaction)).rejects.toThrow(RangeError);
			expect(interaction.reply).not.toHaveBeenCalled();
		});

		test('GIVEN a gateway message THEN replies with the buttons and resolves the author click', async () => {
			const { message, send } = replyTarget();
			const result = new GatewayMessagePrompter('Sure?').run(message);
			await settle();

			expect(send).toHaveBeenCalledOnce();
			const { body } = send.mock.calls[0]![1].resolveBody();
			expect(body!.content).toBe('Sure?');
			const [, no] = customIds(body!.components as Rows);

			const intruder = clickButton(no!, OtherUserId);
			await handleMessagePrompterInteraction(intruder.interaction, intruder.value);
			const owner = clickButton(no!, UserId);
			await handleMessagePrompterInteraction(owner.interaction, owner.value);
			await expect(result).resolves.toBe(false);
		});

		test('GIVEN a gateway message and a timeout above the token lifetime THEN edits the reply through the bot REST route and resolves null', async () => {
			const { message } = replyTarget();
			const result = new GatewayMessagePrompter('Sure?', 'confirm', { timeout: Long }).run(message);
			await settle();

			await vi.advanceTimersByTimeAsync(Long - 1);
			expect(patch).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(1);
			await expect(result).resolves.toBeNull();

			expect(patch).toHaveBeenCalledOnce();
			const [route, options] = patch.mock.calls[0]! as [string, { body: { components: Rows }; auth?: boolean }];
			expect(route).toBe(Routes.channelMessage(ChannelId, CreatedId));
			expect(options).not.toHaveProperty('auth');
		});

		test('GIVEN a channel and an author THEN posts the buttons and resolves the clicked number', async () => {
			const result = new GatewayMessagePrompter('Pick', 'number', { start: 1, end: 3 }).run(textChannel(), { id: UserId });
			await settle();

			expect(post).toHaveBeenCalledOnce();
			const [route, options] = post.mock.calls[0]! as [string, { body: { content: string; components: Rows } }];
			expect(route).toBe(Routes.channelMessages(ChannelId));
			const ids = customIds(options.body.components);
			expect(ids).toHaveLength(3);

			const click = clickButton(ids[2]!, UserId);
			await handleMessagePrompterInteraction(click.interaction, click.value);
			await expect(result).resolves.toBe(3);
		});

		test('GIVEN a channel without an author THEN rejects before sending', async () => {
			await expect(new GatewayMessagePrompter('Sure?').run(textChannel())).rejects.toThrow(TypeError);
			expect(post).not.toHaveBeenCalled();
		});

		test('GIVEN a shared session store THEN rejects before sending', async () => {
			setSessionStore(new RedisSessionStore({ redis: { get: async () => null, set: async () => 'OK', del: async () => 1 } } as never));
			const { message, send } = replyTarget();
			await expect(new GatewayMessagePrompter('Sure?', 'message').run(message)).rejects.toThrow(TypeError);
			expect(send).not.toHaveBeenCalled();
		});
	});

	describe('message strategy', () => {
		test('GIVEN a gateway message THEN replies without components and resolves the author next message', async () => {
			const { message, send } = replyTarget();
			const result = new GatewayMessagePrompter('Your name?', 'message').run(message);
			await settle();

			expect(send).toHaveBeenCalledOnce();
			const { body } = send.mock.calls[0]![1].resolveBody();
			expect(body!.content).toBe('Your name?');
			expect(customIds(body!.components as Rows | undefined)).toEqual([]);

			emitMessage(OtherUserId, 'not me');
			const answer = emitMessage(UserId, 'me');
			await expect(result).resolves.toBe(answer);
		});

		test('GIVEN a channel and an author THEN posts the question and resolves the author message', async () => {
			const result = new GatewayMessagePrompter('Your name?', 'message').run(textChannel(), { id: OtherUserId });
			await settle();

			expect(post).toHaveBeenCalledOnce();
			expect((post.mock.calls[0]![1] as { body: { components?: unknown } }).body.components).toBeUndefined();
			emitMessage(UserId);
			const answer = emitMessage(OtherUserId);
			await expect(result).resolves.toBe(answer);
		});

		test('GIVEN an interaction THEN replies and collects in the interaction channel', async () => {
			const interaction = interactionTarget();
			const result = new GatewayMessagePrompter('Your name?', 'message').run(interaction);
			await settle();

			expect(interaction.reply).toHaveBeenCalledOnce();
			expect((interaction.reply.mock.calls[0]![0] as { components?: unknown }).components).toBeUndefined();
			emitMessage(UserId, 'elsewhere', '100000000000000099');
			const answer = emitMessage(UserId);
			await expect(result).resolves.toBe(answer);
		});

		test('GIVEN an interaction without a channel THEN rejects before replying', async () => {
			const interaction = { ...interactionTarget(), channel: undefined };
			await expect(new GatewayMessagePrompter('Your name?', 'message').run(interaction)).rejects.toThrow(TypeError);
			expect(interaction.reply).not.toHaveBeenCalled();
		});

		test('GIVEN no answer THEN resolves null once the timeout elapses, even above the token lifetime', async () => {
			const { message } = replyTarget();
			const result = new GatewayMessagePrompter('Your name?', 'message', { timeout: Long }).run(message);
			await settle();

			await vi.advanceTimersByTimeAsync(Long - 1);
			emitMessage(OtherUserId);
			await vi.advanceTimersByTimeAsync(1);
			await expect(result).resolves.toBeNull();
			expect(emitter.listenerCount('messageCreate')).toBe(0);
		});

		test('GIVEN a guild target without the MessageContent intent THEN rejects before sending', async () => {
			emitter.options.intents = GatewayIntentBits.GuildMessages;
			const { message, send } = replyTarget();
			await expect(new GatewayMessagePrompter('Your name?', 'message').run(message)).rejects.toThrow(
				'GatewayMessagePrompter "message" strategy needs the MessageContent gateway intents'
			);
			expect(send).not.toHaveBeenCalled();
		});

		test('GIVEN a DM channel without the DirectMessages intent THEN rejects before sending', async () => {
			emitter.options.intents = GatewayIntentBits.GuildMessages | GatewayIntentBits.MessageContent;
			await expect(new GatewayMessagePrompter('Your name?', 'message').run(dmChannel(), { id: UserId })).rejects.toThrow(
				'GatewayMessagePrompter "message" strategy needs the DirectMessages gateway intents'
			);
			expect(post).not.toHaveBeenCalled();
		});

		test('GIVEN a guild channel without any intent THEN names every missing intent', async () => {
			emitter.options.intents = 0;
			await expect(new GatewayMessagePrompter('Your name?', 'message').run(textChannel(), { id: UserId })).rejects.toThrow(
				'GatewayMessagePrompter "message" strategy needs the GuildMessages and MessageContent gateway intents'
			);
			expect(post).not.toHaveBeenCalled();
		});

		test('GIVEN no gateway client THEN rejects before sending', async () => {
			container.client = { emit: () => false } as never;
			const { message, send } = replyTarget();
			await expect(new GatewayMessagePrompter('Your name?', 'message').run(message)).rejects.toThrow(
				'GatewayMessagePrompter "message" strategy needs a GatewayClient from @wolfstar/plugin-gateway'
			);
			expect(send).not.toHaveBeenCalled();
		});
	});

	describe('reaction strategy', () => {
		test('GIVEN a channel THEN reacts with the default emojis in order and resolves the author reaction', async () => {
			const result = new GatewayMessagePrompter('Sure?', 'reaction').run(textChannel(), { id: UserId });
			await settle();

			expect(post).toHaveBeenCalledOnce();
			expect(put.mock.calls.map(([route]) => route)).toEqual([
				Routes.channelMessageOwnReaction(ChannelId, CreatedId, encodeURIComponent('✅')),
				Routes.channelMessageOwnReaction(ChannelId, CreatedId, encodeURIComponent('❌'))
			]);

			emitReaction(OtherUserId, { id: null, name: '❌' });
			emitReaction(UserId, { id: null, name: '👍' });
			emitReaction(UserId, { id: null, name: '❌' }, '100000000000000099');
			emitReaction(UserId, { id: null, name: '❌' });
			await expect(result).resolves.toBe('❌');
		});

		test('GIVEN custom emojis THEN reacts in the configured order and resolves the configured string', async () => {
			const custom = `wolf:${CustomEmojiId}`;
			const { message, send } = replyTarget();
			const result = new GatewayMessagePrompter('Pick', 'reaction', { reactions: ['🐺', custom, '⭐'] }).run(message);
			await settle();

			expect(send).toHaveBeenCalledOnce();
			expect(put.mock.calls.map(([route]) => route)).toEqual([
				Routes.channelMessageOwnReaction(ChannelId, CreatedId, encodeURIComponent('🐺')),
				Routes.channelMessageOwnReaction(ChannelId, CreatedId, custom),
				Routes.channelMessageOwnReaction(ChannelId, CreatedId, encodeURIComponent('⭐'))
			]);

			emitReaction(UserId, { id: CustomEmojiId, name: 'wolf' });
			await expect(result).resolves.toBe(custom);
		});

		test('GIVEN an interaction THEN reacts to the fetched reply', async () => {
			const interaction = interactionTarget();
			const result = new GatewayMessagePrompter('Sure?', 'reaction').run(interaction);
			await settle();

			expect(interaction.reply).toHaveBeenCalledOnce();
			expect(put.mock.calls[0]![0]).toBe(Routes.channelMessageOwnReaction(ChannelId, CreatedId, encodeURIComponent('✅')));
			emitReaction(UserId, { id: null, name: '✅' });
			await expect(result).resolves.toBe('✅');
		});

		test('GIVEN the author reaction arrives with an uncached (null) user THEN resolves it by the event userId', async () => {
			const result = new GatewayMessagePrompter('Sure?', 'reaction').run(dmChannel(), { id: UserId });
			await settle();

			emitReaction(OtherUserId, { id: null, name: '❌' }, CreatedId, false);
			emitReaction(UserId, { id: null, name: '✅' }, CreatedId, false);
			await expect(result).resolves.toBe('✅');
		});

		test('GIVEN a failing reaction THEN logs it and still collects', async () => {
			put.mockRejectedValueOnce(new Error('Missing Permissions'));
			const error = vi.spyOn(container.logger, 'error').mockImplementation(() => undefined);
			const result = new GatewayMessagePrompter('Sure?', 'reaction').run(textChannel(), { id: UserId });
			await settle();

			expect(error).toHaveBeenCalled();
			emitReaction(UserId, { id: null, name: '✅' });
			await expect(result).resolves.toBe('✅');
		});

		test('GIVEN no reaction THEN resolves null once the timeout elapses', async () => {
			const result = new GatewayMessagePrompter('Sure?', 'reaction', { timeout: 1000 }).run(textChannel(), { id: UserId });
			await settle();
			await vi.advanceTimersByTimeAsync(1000);
			await expect(result).resolves.toBeNull();
			expect(emitter.listenerCount('messageReactionAdd')).toBe(0);
		});

		test('GIVEN a guild target without the GuildMessageReactions intent THEN rejects before sending', async () => {
			emitter.options.intents = GatewayIntentBits.DirectMessageReactions;
			const { message, send } = replyTarget();
			await expect(new GatewayMessagePrompter('Sure?', 'reaction').run(message)).rejects.toThrow(
				'GatewayMessagePrompter "reaction" strategy needs the GuildMessageReactions gateway intents'
			);
			expect(send).not.toHaveBeenCalled();
			expect(put).not.toHaveBeenCalled();
		});

		test('GIVEN a DM message without the DirectMessageReactions intent THEN rejects before sending', async () => {
			emitter.options.intents = GatewayIntentBits.GuildMessageReactions;
			const { message, send } = replyTarget({});
			await expect(new GatewayMessagePrompter('Sure?', 'reaction').run(message)).rejects.toThrow(
				'GatewayMessagePrompter "reaction" strategy needs the DirectMessageReactions gateway intents'
			);
			expect(send).not.toHaveBeenCalled();
		});

		test('GIVEN no reactions THEN rejects before sending', async () => {
			await expect(new GatewayMessagePrompter('Sure?', 'reaction', { reactions: [] }).run(textChannel(), { id: UserId })).rejects.toThrow(
				RangeError
			);
			expect(post).not.toHaveBeenCalled();
		});

		test('GIVEN an interaction and a timeout above the token lifetime THEN rejects before replying', async () => {
			const interaction = interactionTarget();
			await expect(new GatewayMessagePrompter('Sure?', 'reaction', { timeout: MaximumTokenLifetime + 1 }).run(interaction)).rejects.toThrow(
				RangeError
			);
			expect(interaction.reply).not.toHaveBeenCalled();
		});
	});
});
