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
import { getPaginatedMessageRuntime } from '../src/lib/PaginatedMessage/runtime.js';
import { handlePaginatedMessageInteraction } from '../src/lib/PaginatedMessage/handle.js';
import { clickButton, fakeCommandInteraction } from './helpers.js';

function fakeRedis() {
	const data = new Map<string, string>();
	const client: RedisSessionClientLike = {
		get: vi.fn(async (key: string) => data.get(key) ?? null),
		set: vi.fn(async (key: string, value: string) => void data.set(key, value)),
		del: vi.fn(async (key: string) => void data.delete(key))
	};
	return { client, data };
}

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

	test('GIVEN eager pages THEN succeeds, writes the session and does not register a runtime entry', async () => {
		const { client, data } = fakeRedis();
		setSessionStore(new RedisSessionStore({ redis: client }));
		const interaction = fakeCommandInteraction(UserData.id);
		const sessionId = await new PaginatedMessage().addPageContent('a').addPageContent('b').run(interaction);

		expect(interaction.reply).toHaveBeenCalledOnce();
		expect(data.size).toBe(1);
		expect(getPaginatedMessageRuntime().get(sessionId)).toBeNull();
	});

	test('GIVEN a click on a custom action id THEN expires instead of falling back to the runtime', async () => {
		const { client } = fakeRedis();
		setSessionStore(new RedisSessionStore({ redis: client }));
		const interaction = fakeCommandInteraction(UserData.id);
		const sessionId = await new PaginatedMessage().addPageContent('a').addPageContent('b').run(interaction);

		const click = clickButton(encodeCustomId(PaginatedMessageHandlerName, sessionId, 'jump'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(click.body()).toMatchObject({ data: { components: [] } });
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
		// Intentionally not awaited: `run` only resolves once the prompt is answered or times out; this test only
		// needs to prove it does not reject synchronously and does reply.
		void new MessagePrompter('Sure?', 'confirm', { store }).run(interaction);
		await new Promise((resolve) => setImmediate(resolve));
		expect(interaction.reply).toHaveBeenCalledOnce();
	});
});
