import { EventEmitter } from 'node:events';
import { container } from '@wolfstar/http-framework';
import { MessageReaction, type Message, type User } from '@wolfstar/plugin-gateway';
import { awaitMessages, awaitReactions } from '../../src/gateway.js';
import { ChannelId, createGatewayMessage, createGatewayUser, MessageId, rawUser } from './helpers.js';

const OtherId = '100000000000000099';

function reaction(overrides: { channelId?: string; messageId?: string; name?: string } = {}): MessageReaction {
	return new MessageReaction({
		channel_id: overrides.channelId ?? ChannelId,
		message_id: overrides.messageId ?? MessageId,
		emoji: { id: null, name: overrides.name ?? '👍' },
		me: false,
		me_burst: false,
		burst_colors: []
	});
}

describe('gateway collectors', () => {
	let previousClient: unknown;
	let emitter: EventEmitter;

	beforeEach(() => {
		vi.useFakeTimers();
		previousClient = container.client;
		emitter = new EventEmitter();
		// `getGatewayClient()` accepts any `container.client` carrying a `gateway`.
		Object.assign(emitter, { gateway: {} });
		container.client = emitter as never;
	});

	afterEach(() => {
		container.client = previousClient as never;
		vi.useRealTimers();
	});

	const message = (id: string, channelId = ChannelId, content = 'content') => createGatewayMessage({ id, channel_id: channelId, content });

	describe('awaitMessages', () => {
		test('GIVEN max messages arrive THEN resolves early and removes its listener', async () => {
			const promise = awaitMessages({ id: ChannelId }, { max: 2, time: 60_000 });
			expect(emitter.listenerCount('messageCreate')).toBe(1);

			const first = message('1');
			const second = message('2');
			emitter.emit('messageCreate', first);
			emitter.emit('messageCreate', second);

			await expect(promise).resolves.toEqual([first, second]);
			expect(emitter.listenerCount('messageCreate')).toBe(0);
		});

		test('GIVEN max defaults to 1 THEN resolves with the first message', async () => {
			const promise = awaitMessages({ id: ChannelId }, { time: 60_000 });
			const first = message('1');
			emitter.emit('messageCreate', first);
			emitter.emit('messageCreate', message('2'));
			await expect(promise).resolves.toEqual([first]);
		});

		test('GIVEN a slow filter on the first message and a fast one on the second THEN max 1 resolves with the first', async () => {
			const first = message('1');
			const second = message('2');
			const filter = (value: Message) =>
				value === first ? new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 100)) : Promise.resolve(true);
			const promise = awaitMessages({ id: ChannelId }, { max: 1, time: 60_000, filter });
			emitter.emit('messageCreate', first);
			emitter.emit('messageCreate', second);

			await vi.advanceTimersByTimeAsync(100);
			await expect(promise).resolves.toEqual([first]);
		});

		test('GIVEN a filter still pending when time elapses THEN resolves with the later messages that already passed', async () => {
			const first = message('1');
			const second = message('2');
			const filter = (value: Message) =>
				value === first ? new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 5000)) : Promise.resolve(true);
			const promise = awaitMessages({ id: ChannelId }, { max: 1, time: 1000, filter });
			emitter.emit('messageCreate', first);
			emitter.emit('messageCreate', second);

			await vi.advanceTimersByTimeAsync(1000);
			await expect(promise).resolves.toEqual([second]);
			expect(emitter.listenerCount('messageCreate')).toBe(0);
		});

		test('GIVEN a failing slow filter on the first message THEN max 1 resolves with the second once the first is decided', async () => {
			const first = message('1');
			const second = message('2');
			const filter = (value: Message) =>
				value === first ? new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 100)) : Promise.resolve(true);
			const promise = awaitMessages({ id: ChannelId }, { max: 1, time: 60_000, filter });
			emitter.emit('messageCreate', first);
			emitter.emit('messageCreate', second);

			await vi.advanceTimersByTimeAsync(100);
			await expect(promise).resolves.toEqual([second]);
		});

		test('GIVEN a slow filter on the first message THEN the collected messages keep their arrival order', async () => {
			const first = message('1');
			const second = message('2');
			const filter = (value: Message) =>
				value === first ? new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 100)) : Promise.resolve(true);
			const promise = awaitMessages({ id: ChannelId }, { max: 2, time: 60_000, filter });
			emitter.emit('messageCreate', first);
			emitter.emit('messageCreate', second);

			await vi.advanceTimersByTimeAsync(100);
			await expect(promise).resolves.toEqual([first, second]);
		});

		test('GIVEN time elapses THEN resolves with the partial results and removes its listener', async () => {
			const promise = awaitMessages({ id: ChannelId }, { max: 3, time: 1000 });
			const first = message('1');
			emitter.emit('messageCreate', first);

			await vi.advanceTimersByTimeAsync(1000);
			await expect(promise).resolves.toEqual([first]);
			expect(emitter.listenerCount('messageCreate')).toBe(0);
		});

		test('GIVEN nothing arrives THEN resolves empty', async () => {
			const promise = awaitMessages({ id: ChannelId }, { time: 1000 });
			await vi.advanceTimersByTimeAsync(1000);
			await expect(promise).resolves.toEqual([]);
		});

		test('GIVEN a message in another channel THEN ignores it', async () => {
			const promise = awaitMessages({ id: ChannelId }, { time: 1000 });
			emitter.emit('messageCreate', message('1', OtherId));
			await vi.advanceTimersByTimeAsync(1000);
			await expect(promise).resolves.toEqual([]);
		});

		test('GIVEN a filter THEN only collects the messages it accepts, awaiting async filters', async () => {
			const filter = vi.fn(async (value: Message) => value.content === 'yes');
			const promise = awaitMessages({ id: ChannelId }, { filter, time: 60_000 });
			emitter.emit('messageCreate', message('1', ChannelId, 'no'));
			const accepted = message('2', ChannelId, 'yes');
			emitter.emit('messageCreate', accepted);

			await expect(promise).resolves.toEqual([accepted]);
			expect(filter).toHaveBeenCalledTimes(2);
			expect(emitter.listenerCount('messageCreate')).toBe(0);
		});

		test('GIVEN the filter throws THEN rejects and removes its listener', async () => {
			const promise = awaitMessages({ id: ChannelId }, { filter: () => Promise.reject(new Error('boom')), time: 60_000 });
			emitter.emit('messageCreate', message('1'));
			await expect(promise).rejects.toThrow('boom');
			expect(emitter.listenerCount('messageCreate')).toBe(0);
		});

		test.each([0, -1, 1.5, Number.NaN, Infinity])('GIVEN time %s THEN throws a RangeError', (time) => {
			expect(() => awaitMessages({ id: ChannelId }, { time })).toThrow(RangeError);
			expect(emitter.listenerCount('messageCreate')).toBe(0);
		});

		test.each([0, -1, 1.5])('GIVEN max %s THEN throws a RangeError', (max) => {
			expect(() => awaitMessages({ id: ChannelId }, { max, time: 1000 })).toThrow(RangeError);
		});
	});

	describe('awaitReactions', () => {
		const target = { id: MessageId, channelId: ChannelId };
		const user = (id = rawUser().id): User => createGatewayUser({ id });

		test('GIVEN max reactions arrive THEN resolves early and removes its listener', async () => {
			const promise = awaitReactions(target, { max: 2, time: 60_000 });
			const first = { reaction: reaction(), user: user(), userId: rawUser().id };
			const second = { reaction: reaction({ name: '👎' }), user: user(OtherId), userId: OtherId };
			emitter.emit('messageReactionAdd', first.reaction, first.user, { userId: first.user.id });
			emitter.emit('messageReactionAdd', second.reaction, second.user, { userId: OtherId });

			await expect(promise).resolves.toEqual([first, second]);
			expect(emitter.listenerCount('messageReactionAdd')).toBe(0);
		});

		test('GIVEN time elapses THEN resolves with the partial results and removes its listener', async () => {
			const promise = awaitReactions(target, { max: 5, time: 1000 });
			const first = { reaction: reaction(), user: user(), userId: rawUser().id };
			emitter.emit('messageReactionAdd', first.reaction, first.user, { userId: first.user.id });

			await vi.advanceTimersByTimeAsync(1000);
			await expect(promise).resolves.toEqual([first]);
			expect(emitter.listenerCount('messageReactionAdd')).toBe(0);
		});

		test('GIVEN reactions on another message or channel THEN ignores them', async () => {
			const promise = awaitReactions(target, { time: 1000 });
			emitter.emit('messageReactionAdd', reaction({ messageId: OtherId }), user(), { userId: rawUser().id });
			emitter.emit('messageReactionAdd', reaction({ channelId: OtherId }), user(), { userId: rawUser().id });

			await vi.advanceTimersByTimeAsync(1000);
			await expect(promise).resolves.toEqual([]);
		});

		test('GIVEN a reaction from an uncached user (user is null) THEN collects it with the userId from the event details', async () => {
			const promise = awaitReactions(target, { filter: ({ userId }) => userId === OtherId, time: 60_000 });
			const collected = reaction();
			emitter.emit('messageReactionAdd', collected, null, { userId: OtherId });

			await expect(promise).resolves.toEqual([{ reaction: collected, user: null, userId: OtherId }]);
		});

		test('GIVEN a filter THEN only collects the reactions it accepts', async () => {
			const promise = awaitReactions(target, { filter: ({ reaction }) => reaction.emoji.name === '✅', time: 60_000 });
			emitter.emit('messageReactionAdd', reaction({ name: '❌' }), user(), { userId: rawUser().id });
			const accepted = { reaction: reaction({ name: '✅' }), user: user(), userId: rawUser().id };
			emitter.emit('messageReactionAdd', accepted.reaction, accepted.user, { userId: rawUser().id });

			await expect(promise).resolves.toEqual([accepted]);
		});

		test('GIVEN a time above the maximum timer delay THEN throws a RangeError without listening', () => {
			expect(() => awaitReactions(target, { time: 2 ** 31 })).toThrow(RangeError);
			expect(() => awaitMessages({ id: ChannelId }, { time: 2 ** 31 })).toThrow(RangeError);
			expect(emitter.listenerCount('messageReactionAdd')).toBe(0);
			expect(emitter.listenerCount('messageCreate')).toBe(0);
			expect(vi.getTimerCount()).toBe(0);
		});

		test('GIVEN an invalid time THEN throws a RangeError', () => {
			expect(() => awaitReactions(target, { time: 0 })).toThrow(RangeError);
			expect(emitter.listenerCount('messageReactionAdd')).toBe(0);
		});
	});

	describe('without a gateway client', () => {
		test.each([undefined, { emit: () => true }])(
			'GIVEN container.client %o THEN both collectors reject clearly and leave no timer',
			async (client) => {
				container.client = client as never;
				await expect(awaitMessages({ id: ChannelId }, { time: 1000 })).rejects.toThrow(
					'awaitMessages needs a GatewayClient from @wolfstar/plugin-gateway'
				);
				await expect(awaitReactions({ id: MessageId, channelId: ChannelId }, { time: 1000 })).rejects.toThrow(
					'awaitReactions needs a GatewayClient from @wolfstar/plugin-gateway'
				);
				expect(vi.getTimerCount()).toBe(0);
				expect(emitter.listenerCount('messageCreate')).toBe(0);
				expect(emitter.listenerCount('messageReactionAdd')).toBe(0);
			}
		);
	});
});
