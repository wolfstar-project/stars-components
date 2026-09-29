import { getSessionStore, MemorySessionStore, RedisSessionStore, setSessionStore, type RedisSessionClientLike } from '../src/index.js';

describe('MemorySessionStore', () => {
	afterEach(() => vi.useRealTimers());

	test('GIVEN a value THEN get returns it until the ttl elapses', () => {
		vi.useFakeTimers();
		const store = new MemorySessionStore<string>({ sweepInterval: 0 });
		store.set('a', 'value', 1000);
		expect(store.get('a')).toBe('value');
		vi.advanceTimersByTime(1000);
		expect(store.get('a')).toBeNull();
		expect(store.size).toBe(0);
	});

	test('GIVEN expired entries THEN sweep removes them', () => {
		vi.useFakeTimers();
		const store = new MemorySessionStore<number>({ sweepInterval: 0 });
		store.set('a', 1, 100);
		store.set('b', 2, 10_000);
		vi.advanceTimersByTime(500);
		expect(store.sweep()).toBe(1);
		expect(store.size).toBe(1);
	});

	test('GIVEN a sweep interval THEN expired entries are swept automatically', () => {
		vi.useFakeTimers();
		const store = new MemorySessionStore<number>({ sweepInterval: 1000 });
		store.set('a', 1, 100);
		vi.advanceTimersByTime(1000);
		expect(store.size).toBe(0);
		store.destroy();
	});

	test('GIVEN delete THEN the value is gone', () => {
		const store = new MemorySessionStore<number>({ sweepInterval: 0 });
		store.set('a', 1, 1000);
		store.delete('a');
		expect(store.get('a')).toBeNull();
	});
});

describe('RedisSessionStore', () => {
	function fakeRedis() {
		const data = new Map<string, string>();
		const client: RedisSessionClientLike = {
			get: vi.fn(async (key: string) => data.get(key) ?? null),
			set: vi.fn(async (key: string, value: string) => void data.set(key, value)),
			del: vi.fn(async (key: string) => void data.delete(key))
		};
		return { client, data };
	}

	test('GIVEN set THEN stores JSON under the prefix with PX', async () => {
		const { client, data } = fakeRedis();
		const store = new RedisSessionStore<{ index: number }>({ redis: client, prefix: 'bot' });
		await store.set('abc', { index: 2 }, 5000);
		expect(client.set).toHaveBeenCalledWith('bot:abc', '{"index":2}', 'PX', 5000);
		expect(data.get('bot:abc')).toBe('{"index":2}');
		expect(await store.get('abc')).toEqual({ index: 2 });
		await store.delete('abc');
		expect(await store.get('abc')).toBeNull();
	});

	test('GIVEN no prefix THEN uses wolfstar:sessions', async () => {
		const { client } = fakeRedis();
		await new RedisSessionStore({ redis: client }).set('x', 1, 10);
		expect(client.set).toHaveBeenCalledWith('wolfstar:sessions:x', '1', 'PX', 10);
	});
});

describe('session store configuration', () => {
	test('GIVEN setSessionStore THEN getSessionStore returns it', () => {
		const previous = getSessionStore();
		const store = new MemorySessionStore({ sweepInterval: 0 });
		try {
			setSessionStore(store);
			expect(getSessionStore()).toBe(store);
		} finally {
			setSessionStore(previous);
		}
	});
});
