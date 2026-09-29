import { getGatewayClient, type GatewayClient, type GatewayEventMap, type Message, type MessageReaction, type User } from '@wolfstar/plugin-gateway';
import type { Awaitable } from '../sessions/SessionStore.js';
import { MaximumTimerDelay } from '../timers.js';

export interface AwaitOptions<T> {
	/**
	 * Which values to collect; every value of the target is collected without one.
	 */
	filter?: (value: T) => Awaitable<boolean>;
	/**
	 * How many values to collect before resolving, a positive integer.
	 *
	 * @default 1
	 */
	max?: number;
	/**
	 * How long to collect for, in milliseconds, a positive integer of at most 2^31 - 1 (~24.8 days, the longest
	 * `setTimeout` delay). The collector resolves with whatever it collected when it elapses.
	 */
	time: number;
}

export interface CollectedReaction {
	reaction: MessageReaction;
	/**
	 * The user who reacted, `null` when plugin-gateway knows neither from the payload nor from its cache (e.g. in DMs
	 * without a user cache). Use {@linkcode userId} to identify them.
	 */
	user: User | null;
	/**
	 * The ID of the user who reacted, always known.
	 */
	userId: string;
}

type EventName = 'messageCreate' | 'messageReactionAdd';
type Listener<Event extends EventName> = (...args: GatewayEventMap[Event]) => void;

function assertPositiveInteger(name: string, value: number): void {
	if (!Number.isInteger(value) || value <= 0) throw new RangeError(`The collector's ${name} must be a positive integer, received ${value}`);
}

/**
 * Listens to a client event until `max` values pass the filter or `time` elapses, and always removes its listener.
 * Filters run concurrently, but values are committed in arrival order: a value counts once it and every earlier value
 * have a decided filter result. When `time` elapses, every value whose filter already passed is kept, in arrival order.
 * A throwing filter rejects the collector.
 *
 * @param name The public function's name, for the error thrown without a gateway client.
 * @param pick Maps an event to the value to collect, `null` when the event is not about the target.
 */
function collect<Event extends EventName, T>(
	name: string,
	event: Event,
	options: AwaitOptions<T>,
	pick: (...args: GatewayEventMap[Event]) => T | null
): Promise<T[]> {
	const { filter, max = 1, time } = options;
	assertPositiveInteger('time', time);
	if (time > MaximumTimerDelay) throw new RangeError(`The collector's time must be at most ${MaximumTimerDelay} ms, received ${time}`);
	assertPositiveInteger('max', max);

	let gatewayClient: GatewayClient;
	try {
		gatewayClient = getGatewayClient();
	} catch {
		return Promise.reject(new Error(`${name} needs a GatewayClient from @wolfstar/plugin-gateway`));
	}

	// plugin-gateway augments the framework's `ClientEvents` with `GatewayEventMap`, but the emitter's overloads cannot
	// resolve a listener for a generic event name, so the client is narrowed to the two events used here.
	const client = gatewayClient as unknown as {
		on<E extends EventName>(event: E, listener: Listener<E>): unknown;
		off<E extends EventName>(event: E, listener: Listener<E>): unknown;
	};

	return new Promise<T[]>((resolve, reject) => {
		// Every event about the target, in arrival order, with its filter result once decided.
		const events: { value: T; passed: boolean | null }[] = [];
		const collected: T[] = [];
		let committed = 0;
		let settled = false;

		const finish = (error?: unknown) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			client.off(event, listener);
			if (error !== undefined) return reject(error);

			// On timeout, the events decided after a still-pending one are kept too, in arrival order.
			for (const entry of events.slice(committed)) {
				if (collected.length >= max) break;
				if (entry.passed === true) collected.push(entry.value);
			}

			resolve(collected);
		};

		// Commits the decided events up to the first pending one, so results keep arrival order.
		const commit = () => {
			while (!settled && committed < events.length && events[committed]!.passed !== null) {
				const entry = events[committed++]!;
				if (!entry.passed) continue;
				collected.push(entry.value);
				if (collected.length >= max) finish();
			}
		};

		const decide = async (entry: { value: T; passed: boolean | null }) => {
			try {
				entry.passed = filter ? Boolean(await filter(entry.value)) : true;
			} catch (error) {
				finish(error ?? new Error('The collector filter threw'));
				return;
			}

			commit();
		};

		// Filters run concurrently as events arrive, so a slow filter cannot hide a later event that qualified in time.
		const listener: Listener<Event> = (...args) => {
			if (settled) return;
			const value = pick(...args);
			if (value === null) return;

			const entry = { value, passed: null };
			events.push(entry);
			void decide(entry);
		};

		const timer = setTimeout(() => finish(), time);
		timer.unref?.();
		client.on(event, listener);
	});
}

/**
 * Collects the messages sent in a channel, from the client's `messageCreate` events.
 *
 * @returns The collected messages, once `max` of them are collected or `time` elapses.
 * @throws {RangeError} When `time` or `max` is not a positive integer, or `time` exceeds 2^31 - 1.
 * @remarks Rejects when `container.client` is not a `GatewayClient`.
 */
export function awaitMessages(channel: { id: string }, options: AwaitOptions<Message>): Promise<Message[]> {
	return collect('awaitMessages', 'messageCreate', options, (message) => (message.channelId === channel.id ? message : null));
}

/**
 * Collects the reactions added to a message, from the client's `messageReactionAdd` events. Reactions from uncached
 * users are collected too, with a `null` {@linkcode CollectedReaction.user}: filter on
 * {@linkcode CollectedReaction.userId}.
 *
 * @returns The collected reactions, once `max` of them are collected or `time` elapses.
 * @throws {RangeError} When `time` or `max` is not a positive integer, or `time` exceeds 2^31 - 1.
 * @remarks Rejects when `container.client` is not a `GatewayClient`.
 */
export function awaitReactions(message: { id: string; channelId: string }, options: AwaitOptions<CollectedReaction>): Promise<CollectedReaction[]> {
	return collect('awaitReactions', 'messageReactionAdd', options, (reaction, user, { userId }) =>
		reaction.messageId === message.id && reaction.channelId === message.channelId ? { reaction, user, userId } : null
	);
}
