import { UserData } from '@wolfstar/http-framework-test-utils';
import {
	assertSharedSessionState,
	encodeCustomId,
	MemorySessionStore,
	MessagePrompter,
	PaginatedMessage,
	PaginatedMessageHandlerName,
	RedisSessionStore,
	setSessionStore,
	type RedisSessionClientLike
} from '../src/index.js';
import { handleMessagePrompterInteraction } from '../src/lib/MessagePrompter/handle.js';
import { getPaginatedMessageRuntime } from '../src/lib/PaginatedMessage/runtime.js';
import { handlePaginatedMessageInteraction } from '../src/lib/PaginatedMessage/handle.js';
import { clickButton, fakeCommandInteraction, useMemorySessionStore } from './helpers.js';

function fakeRedis() {
	const data = new Map<string, string>();
	const client: RedisSessionClientLike = {
		get: vi.fn(async (key: string) => data.get(key) ?? null),
		set: vi.fn(async (key: string, value: string) => void data.set(key, value)),
		del: vi.fn(async (key: string) => void data.delete(key))
	};
	return { client, data };
}

useMemorySessionStore();

describe('SessionStore scope', () => {
	test('GIVEN MemorySessionStore THEN scope is process', () => {
		expect(new MemorySessionStore({ sweepInterval: 0 }).scope).toBe('process');
	});

	test('GIVEN RedisSessionStore THEN scope is shared', () => {
		expect(new RedisSessionStore({ redis: fakeRedis().client }).scope).toBe('shared');
	});
});

describe('assertSharedSessionState', () => {
	test('GIVEN an eager JSON session THEN does not throw', () => {
		const session = {
			ownerId: 'abc',
			index: 0,
			pages: [{ content: 'a' }, { content: 'b' }],
			actions: [{ id: 'next', type: 'button' }],
			idle: 1000,
			wrongUserReply: 'no'
		};
		expect(() => assertSharedSessionState(session)).not.toThrow();
	});

	test('GIVEN a function THEN throws naming its path', () => {
		expect(() => assertSharedSessionState({ actions: { jump: { run: () => undefined } } })).toThrow('actions.jump.run');
	});

	test('GIVEN a symbol THEN throws naming its path', () => {
		expect(() => assertSharedSessionState({ tag: Symbol('x') })).toThrow('tag');
	});

	test('GIVEN a bigint THEN throws naming its path', () => {
		expect(() => assertSharedSessionState({ count: 1n })).toThrow('count');
	});

	test('GIVEN undefined inside an array THEN throws naming its path', () => {
		expect(() => assertSharedSessionState({ items: [1, undefined, 3] })).toThrow('items[1]');
	});

	test('GIVEN a non-plain object THEN throws naming its path', () => {
		expect(() => assertSharedSessionState({ when: new Date() })).toThrow('when');
	});

	test('GIVEN NaN THEN throws naming its path', () => {
		expect(() => assertSharedSessionState({ value: Number.NaN })).toThrow('value');
	});

	test('GIVEN Infinity THEN throws naming its path', () => {
		expect(() => assertSharedSessionState({ value: Number.POSITIVE_INFINITY })).toThrow('value');
	});

	test('GIVEN a null entry under pages THEN throws naming its path', () => {
		expect(() => assertSharedSessionState({ pages: [{ content: 'a' }, null] })).toThrow('pages[1]');
	});

	test('GIVEN a null entry outside pages THEN does not throw', () => {
		expect(() => assertSharedSessionState({ other: [null] })).not.toThrow();
	});

	test('GIVEN a circular reference THEN throws naming its path instead of overflowing the stack', () => {
		const cyclic: { self?: unknown } = {};
		cyclic.self = cyclic;
		expect(() => assertSharedSessionState({ node: cyclic })).toThrow('node.self');
		expect(() => assertSharedSessionState({ node: cyclic })).toThrow('circular reference');
	});

	test('GIVEN a value shared by two sibling paths (not an ancestor) THEN does not throw', () => {
		const shared = { content: 'a' };
		expect(() => assertSharedSessionState({ pages: [shared, shared] })).not.toThrow();
	});
});

describe('RedisSessionStore#set with unshareable state', () => {
	test('GIVEN a function value THEN rejects without calling redis.set', async () => {
		const { client } = fakeRedis();
		const store = new RedisSessionStore({ redis: client });
		await expect(store.set('id', { run: () => undefined }, 1000)).rejects.toThrow(TypeError);
		expect(client.set).not.toHaveBeenCalled();
	});
});

describe('PaginatedMessage with a shared store', () => {
	test('GIVEN a function page THEN rejects before interaction.reply is called', async () => {
		const { client } = fakeRedis();
		setSessionStore(new RedisSessionStore({ redis: client }));
		const interaction = fakeCommandInteraction(UserData.id);
		await expect(new PaginatedMessage().addPage(() => ({ content: 'lazy' })).run(interaction)).rejects.toThrow(TypeError);
		expect(interaction.reply).not.toHaveBeenCalled();
	});

	test('GIVEN a custom action with run THEN rejects before interaction.reply is called', async () => {
		const { client } = fakeRedis();
		setSessionStore(new RedisSessionStore({ redis: client }));
		const interaction = fakeCommandInteraction(UserData.id);
		await expect(
			new PaginatedMessage()
				.addPageContent('a')
				.addAction({ id: 'jump', type: 'button', label: 'Jump', run: () => undefined })
				.run(interaction)
		).rejects.toThrow(TypeError);
		expect(interaction.reply).not.toHaveBeenCalled();
	});

	test('GIVEN eager pages THEN succeeds, writes the session and registers a runtime entry pointing at its store', async () => {
		const { client, data } = fakeRedis();
		setSessionStore(new RedisSessionStore({ redis: client }));
		const interaction = fakeCommandInteraction(UserData.id);
		const message = new PaginatedMessage().addPageContent('a').addPageContent('b');
		const sessionId = await message.run(interaction);

		expect(interaction.reply).toHaveBeenCalledOnce();
		expect(data.size).toBe(1);
		expect(getPaginatedMessageRuntime().get(sessionId)).toBe(message);
	});

	test('GIVEN a click on a custom action id THEN expires instead of falling back to the runtime', async () => {
		const { client } = fakeRedis();
		setSessionStore(new RedisSessionStore({ redis: client }));
		const interaction = fakeCommandInteraction(UserData.id);
		const sessionId = await new PaginatedMessage().addPageContent('a').addPageContent('b').run(interaction);

		// A shared-store session never registers a runtime entry itself (asserted above), but another codepath in
		// this same process could still have one lying around for the same session id (e.g. a stale/left-over entry,
		// or a bug reintroducing runtime registration for shared stores). Plant one by hand, with a `jump` action
		// whose `run` would prove the runtime was actually consulted, to prove `handlePaginatedMessageInteraction`
		// never trusts it once the store says the session is shared.
		const run = vi.fn();
		const runtimeInstance = new PaginatedMessage()
			.addPageContent('a')
			.addPageContent('b')
			.addAction({ id: 'jump', type: 'button', label: 'Jump', run });
		getPaginatedMessageRuntime().set(sessionId, runtimeInstance, 1000);

		const click = clickButton(encodeCustomId(PaginatedMessageHandlerName, sessionId, 'jump'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(click.body()).toMatchObject({ data: { components: [] } });
		expect(run).not.toHaveBeenCalled();
	});
});

describe('PaginatedMessage with a per-instance shared store and the default memory store', () => {
	test('GIVEN a next click on the creating process THEN reads the instance store and updates to page 2', async () => {
		const { client, data } = fakeRedis();
		const store = new RedisSessionStore({ redis: client });
		const interaction = fakeCommandInteraction(UserData.id);
		const message = new PaginatedMessage({ store }).addPageContent('a').addPageContent('b');
		const sessionId = await message.run(interaction);
		expect(data.size).toBe(1);

		const refresh = vi.spyOn(getPaginatedMessageRuntime(), 'set');
		const click = clickButton(encodeCustomId(PaginatedMessageHandlerName, sessionId, 'next'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);

		expect(click.body()).toMatchObject({ data: { content: 'b' } });
		await expect(store.get(sessionId)).resolves.toMatchObject({ index: 1 });
		// The runtime entry's TTL follows the session's, so later clicks still find the instance store.
		expect(refresh).toHaveBeenCalledWith(sessionId, message, expect.any(Number));
		refresh.mockRestore();
	});

	test('GIVEN a custom action added to that instance after run THEN still expires (no runtime fallback)', async () => {
		const { client } = fakeRedis();
		const store = new RedisSessionStore({ redis: client });
		const interaction = fakeCommandInteraction(UserData.id);
		const message = new PaginatedMessage({ store }).addPageContent('a').addPageContent('b');
		const sessionId = await message.run(interaction);

		const run = vi.fn();
		message.addAction({ id: 'jump', type: 'button', label: 'Jump', run });

		const click = clickButton(encodeCustomId(PaginatedMessageHandlerName, sessionId, 'jump'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(click.body()).toMatchObject({ data: { components: [] } });
		expect(run).not.toHaveBeenCalled();
	});
});

describe('MessagePrompter with a shared store', () => {
	test('GIVEN the default shared store THEN run rejects before replying', async () => {
		const { client } = fakeRedis();
		setSessionStore(new RedisSessionStore({ redis: client }));
		const interaction = fakeCommandInteraction(UserData.id);
		await expect(new MessagePrompter('Sure?').run(interaction)).rejects.toThrow(TypeError);
		expect(interaction.reply).not.toHaveBeenCalled();
	});

	test('GIVEN options.store set to a MemorySessionStore THEN run works', async () => {
		const { client } = fakeRedis();
		setSessionStore(new RedisSessionStore({ redis: client }));
		const interaction = fakeCommandInteraction(UserData.id);
		const store = new MemorySessionStore({ sweepInterval: 0 });
		// `run` only settles once the prompt is answered: answer it so the promise is awaited, never left dangling.
		const answer = new MessagePrompter('Sure?', 'confirm', { store }).run(interaction);
		await new Promise((resolve) => setImmediate(resolve));
		expect(interaction.reply).toHaveBeenCalledOnce();

		const payload = interaction.reply.mock.calls[0]![0] as { components: { components: { custom_id: string }[] }[] };
		const click = clickButton(payload.components[0]!.components[0]!.custom_id);
		await handleMessagePrompterInteraction(click.interaction, click.value);
		await expect(answer).resolves.toBe(true);
	});
});
