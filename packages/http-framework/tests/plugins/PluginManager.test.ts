import { TestableClient } from '@wolfstar/http-framework-test-utils';
import {
	Client,
	Plugin,
	PluginHook,
	PluginManager,
	postInitialization,
	postListen,
	preGenericsInitialization,
	preInitialization,
	preLoad,
	type HttpFrameworkPluginHook
} from '../../src/index.js';

describe('PluginManager', () => {
	test('GIVEN a fresh manager THEN the registry is empty', () => {
		const manager = new PluginManager();
		expect(manager.registry.size).toBe(0);
		expect([...manager.values()]).toHaveLength(0);
	});

	test('GIVEN a non-function hook THEN registerHook throws a TypeError', () => {
		const manager = new PluginManager();
		expect(() => manager.registerHook(undefined as unknown as HttpFrameworkPluginHook, PluginHook.PreInitialization, 'broken')).toThrow(
			new TypeError('The provided hook (broken) is not a function')
		);
		expect(manager.registry.size).toBe(0);
	});

	test('GIVEN the helper methods THEN they register entries with the matching type', () => {
		const manager = new PluginManager();
		const hook = vi.fn();

		manager
			.registerPreGenericsInitializationHook(hook, 'a')
			.registerPreInitializationHook(hook, 'b')
			.registerPostInitializationHook(hook, 'c')
			.registerPreLoadHook(hook, 'd')
			.registerPostListenHook(hook, 'e');

		const types = [...manager.values()].map((entry) => entry.type);
		expect(types).toEqual([
			PluginHook.PreGenericsInitialization,
			PluginHook.PreInitialization,
			PluginHook.PostInitialization,
			PluginHook.PreLoad,
			PluginHook.PostListen
		]);
	});

	test('GIVEN values with a hook filter THEN it only yields the matching entries', () => {
		const manager = new PluginManager();
		const hook = vi.fn();

		manager.registerPreInitializationHook(hook, 'sync').registerPreLoadHook(hook, 'async');

		const preLoadEntries = [...manager.values(PluginHook.PreLoad)];
		expect(preLoadEntries).toHaveLength(1);
		expect(preLoadEntries[0].name).toBe('async');
	});

	test('GIVEN a plugin THEN use only registers the present symbol hooks', () => {
		const manager = new PluginManager();
		const preInit = vi.fn();
		const postListenHook = vi.fn();

		class TestPlugin extends Plugin {
			public static override [preInitialization] = preInit;
			public static override [postListen] = postListenHook;
		}

		manager.use(TestPlugin);

		const entries = [...manager.values()];
		expect(entries).toHaveLength(2);
		expect(entries.map((entry) => entry.type)).toEqual([PluginHook.PreInitialization, PluginHook.PostListen]);
	});
});

describe('Client plugin lifecycle', () => {
	afterEach(() => {
		Client.plugins.registry.clear();
	});

	test('GIVEN sync hooks THEN they run in order during construction with the client as this', () => {
		const preGenerics = vi.fn();
		const preInit = vi.fn();
		const postInit = vi.fn();

		class TestPlugin extends Plugin {
			public static override [preGenericsInitialization] = preGenerics;
			public static override [preInitialization] = preInit;
			public static override [postInitialization] = postInit;
		}

		Client.use(TestPlugin);

		const client = new TestableClient();

		expect(preGenerics).toHaveBeenCalledOnce();
		expect(preInit).toHaveBeenCalledOnce();
		expect(postInit).toHaveBeenCalledOnce();
		expect(preGenerics.mock.invocationCallOrder[0]).toBeLessThan(preInit.mock.invocationCallOrder[0]);
		expect(preInit.mock.invocationCallOrder[0]).toBeLessThan(postInit.mock.invocationCallOrder[0]);
		expect(preGenerics.mock.instances[0]).toBe(client);
	});

	test('GIVEN a preLoad hook THEN it runs during load and emits pluginLoaded', async () => {
		const preLoadHook = vi.fn();

		class TestPlugin extends Plugin {
			public static override [preLoad] = preLoadHook;
		}

		Client.use(TestPlugin);

		const client = new TestableClient();
		const loaded = vi.fn();
		client.on('pluginLoaded', loaded);

		await client.load({ baseUserDirectory: null });

		expect(preLoadHook).toHaveBeenCalledOnce();
		expect(preLoadHook.mock.instances[0]).toBe(client);
		expect(loaded).toHaveBeenCalledWith(PluginHook.PreLoad, undefined);
	});

	test('GIVEN a postListen hook THEN it runs after the server starts and emits pluginLoaded', async () => {
		const postListenHook = vi.fn();

		class TestPlugin extends Plugin {
			public static override [postListen] = postListenHook;
		}

		Client.use(TestPlugin);

		const client = new TestableClient();
		const loaded = vi.fn();
		client.on('pluginLoaded', loaded);

		await client.listen({ port: 0 });

		try {
			expect(postListenHook).toHaveBeenCalledOnce();
			expect(postListenHook.mock.instances[0]).toBe(client);
			expect(loaded).toHaveBeenCalledWith(PluginHook.PostListen, undefined);
		} finally {
			await new Promise<void>((resolve) => client.server.close(() => resolve()));
		}
	});
});
