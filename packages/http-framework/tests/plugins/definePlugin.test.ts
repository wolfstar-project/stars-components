import { TestableClient } from '@wolfstar/http-framework-test-utils';
import { Client, Plugin, PluginHook, PluginHookError, PluginManager, definePlugin, preInitialization, type StarsPlugin } from '../../src/index.js';

describe('definePlugin', () => {
	test('GIVEN a plugin object THEN it is returned unchanged', () => {
		const plugin: StarsPlugin = { name: 'test:object' };
		expect(definePlugin(plugin)).toBe(plugin);
	});

	test('GIVEN an options factory THEN it forwards the options and returns the plugin', () => {
		const factory = definePlugin((options: { prefix?: string } = {}) => ({ name: `test:${options.prefix ?? 'default'}` }));

		expect(factory({ prefix: 'x' }).name).toBe('test:x');
		expect(factory().name).toBe('test:default');
	});
});

describe('PluginManager with plugin objects', () => {
	test('GIVEN plugins with enforce THEN pre runs first, then plain, then post, stable inside each group', () => {
		const manager = new PluginManager();
		manager.use(
			{ name: 'post-1', enforce: 'post', preInitialization() {} },
			{ name: 'plain-1', preInitialization() {} },
			{ name: 'pre-1', enforce: 'pre', preInitialization() {} },
			{ name: 'plain-2', preInitialization() {} },
			{ name: 'pre-2', enforce: 'pre', preInitialization() {} },
			{ name: 'post-2', enforce: 'post', preInitialization() {} }
		);

		const names = [...manager.values(PluginHook.PreInitialization)].map((entry) => entry.name);
		expect(names).toEqual(['pre-1', 'pre-2', 'plain-1', 'plain-2', 'post-1', 'post-2']);
	});

	test('GIVEN nested arrays and falsy entries THEN they are flattened and dropped', () => {
		const manager = new PluginManager();
		manager.use([{ name: 'a', preLoad() {} }, [{ name: 'b', preLoad() {} }, false, null, undefined]], false, { name: 'c', preLoad() {} });

		expect([...manager.values(PluginHook.PreLoad)].map((entry) => entry.name)).toEqual(['a', 'b', 'c']);
	});

	test('GIVEN a plugin without a name THEN use throws a TypeError', () => {
		const manager = new PluginManager();
		expect(() => manager.use({ name: '' })).toThrow(new TypeError('A plugin must have a non-empty name'));
	});

	test('GIVEN a plugin THEN only the defined hooks are yielded', () => {
		const manager = new PluginManager();
		manager.use({ name: 'partial', preInitialization() {}, postListen() {} });

		expect([...manager.values()].map((entry) => entry.type)).toEqual([PluginHook.PreInitialization, PluginHook.PostListen]);
	});

	test('GIVEN a legacy class THEN use still registers it with the class name', () => {
		const manager = new PluginManager();
		class Legacy extends Plugin {
			public static override [preInitialization] = vi.fn();
		}
		manager.use(Legacy);

		expect([...manager.values()].map((entry) => entry.name)).toEqual(['Legacy']);
	});
});

describe('Client with plugin objects', () => {
	afterEach(() => {
		Client.plugins.registry.clear();
	});

	test('GIVEN a registered plugin THEN hooks receive the client and the shared credential-free options', async () => {
		const preInit = vi.fn();
		const preLoad = vi.fn();
		const postListen = vi.fn();
		Client.use(definePlugin({ name: 'test:args', preInitialization: preInit, preLoad, postListen }));

		const client = new TestableClient();
		await client.load({ baseUserDirectory: null });
		await client.listen({ port: 0 });

		try {
			expect(preInit).toHaveBeenCalledExactlyOnceWith(client, client.options);
			expect(preLoad).toHaveBeenCalledExactlyOnceWith(client, client.options);
			expect(postListen).toHaveBeenCalledExactlyOnceWith(client, client.options);
		} finally {
			await new Promise<void>((resolve) => client.server.close(() => resolve()));
		}
	});

	test('GIVEN plugins in ClientOptions THEN they run for that client only, merged by enforce with registered ones', () => {
		const calls: string[] = [];
		Client.use({ name: 'static', preInitialization: () => void calls.push('static') });

		const client = new TestableClient({
			plugins: [
				{ name: 'post', enforce: 'post', preInitialization: () => void calls.push('post') },
				false,
				[{ name: 'pre', enforce: 'pre', preInitialization: () => void calls.push('pre') }]
			]
		});
		expect(client).toBeInstanceOf(Client);
		expect(calls).toEqual(['pre', 'static', 'post']);

		calls.length = 0;
		new TestableClient();
		expect(calls).toEqual(['static']);
	});

	test('GIVEN a plugin hook that throws THEN the error is a PluginHookError naming the plugin and carrying the cause', () => {
		const cause = new Error('boom');
		Client.use({
			name: 'test:thrower',
			preInitialization() {
				throw cause;
			}
		});

		let thrown: unknown;
		try {
			new TestableClient();
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(PluginHookError);
		expect(thrown).toMatchObject({ pluginName: 'test:thrower', hook: PluginHook.PreInitialization, cause });
		expect((thrown as Error).message).toContain('test:thrower');
	});

	test('GIVEN an async hook that rejects THEN load rejects with a PluginHookError', async () => {
		const cause = new Error('async boom');
		Client.use({ name: 'test:async', preLoad: () => Promise.reject(cause) });

		const client = new TestableClient();
		await expect(client.load({ baseUserDirectory: null })).rejects.toMatchObject({ pluginName: 'test:async', cause });
	});

	test('GIVEN a plugin THEN pluginLoaded is emitted with the hook type and the plugin name', async () => {
		Client.use({ name: 'test:event', preLoad() {} });

		const client = new TestableClient();
		const loaded = vi.fn();
		client.on('pluginLoaded', loaded);
		await client.load({ baseUserDirectory: null });

		expect(loaded).toHaveBeenCalledWith(PluginHook.PreLoad, 'test:event');
	});

	test('GIVEN apply THEN the plugin only runs in the matching environment or when the function returns true', () => {
		const calls: string[] = [];
		const env = process.env.NODE_ENV;
		try {
			process.env.NODE_ENV = 'production';
			Client.use(
				{ name: 'dev-only', apply: 'development', preInitialization: () => void calls.push('dev-only') },
				{ name: 'prod-only', apply: 'production', preInitialization: () => void calls.push('prod-only') },
				{ name: 'fn-false', apply: () => false, preInitialization: () => void calls.push('fn-false') },
				{ name: 'fn-true', apply: () => true, preInitialization: () => void calls.push('fn-true') }
			);

			new TestableClient();
			expect(calls).toEqual(['prod-only', 'fn-true']);
		} finally {
			process.env.NODE_ENV = env;
		}
	});

	test('GIVEN an apply function THEN it is decided once per client, with the options, for every hook of the plugin', async () => {
		const decisions = [true, false, false, false];
		const apply = vi.fn(() => decisions.shift() ?? false);
		const calls: string[] = [];
		Client.use({
			name: 'test:stable',
			apply,
			preGenericsInitialization: () => void calls.push('preGenerics'),
			preInitialization: () => void calls.push('preInit'),
			postInitialization: () => void calls.push('postInit'),
			preLoad: () => void calls.push('preLoad')
		});

		const client = new TestableClient();
		await client.load({ baseUserDirectory: null });

		expect(calls).toEqual(['preGenerics', 'preInit', 'postInit', 'preLoad']);
		expect(apply).toHaveBeenCalledExactlyOnceWith(client.options);

		// Another client decides for itself.
		calls.length = 0;
		new TestableClient();
		expect(calls).toEqual([]);
		expect(apply).toHaveBeenCalledTimes(2);
	});

	test('GIVEN plugins sharing an apply function THEN each decides for itself, once, when its first hook runs', () => {
		const apply = vi.fn((options: { bodySizeLimit?: number }) => options.bodySizeLimit === undefined);
		const calls: string[] = [];
		Client.use(
			{
				name: 'test:first',
				apply,
				preGenericsInitialization(_client, options) {
					calls.push('first');
					// The next plugin sees what this one changed.
					options.bodySizeLimit = 1;
				},
				preInitialization: () => void calls.push('first again')
			},
			{ name: 'test:second', apply, preInitialization: () => void calls.push('second') }
		);

		new TestableClient();

		expect(calls).toEqual(['first', 'first again']);
		expect(apply).toHaveBeenCalledTimes(2);
	});

	test('GIVEN an entry THEN hook is still the this-bound function the registry always exposed', () => {
		const manager = new PluginManager();
		const received: unknown[] = [];
		manager.use({ name: 'compat', preInitialization: (...args) => void received.push(...args) });
		const legacyHook = vi.fn();
		class Legacy extends Plugin {
			public static override [preInitialization] = legacyHook;
		}
		manager.use(Legacy);

		const client = {} as Client;
		const options = {};
		for (const entry of manager.values(PluginHook.PreInitialization)) entry.hook.call(client, options);

		expect(received).toEqual([client, options]);
		expect(legacyHook).toHaveBeenCalledExactlyOnceWith(options);
		expect(legacyHook.mock.instances[0]).toBe(client);
	});

	test('GIVEN a legacy hook THEN errors are not wrapped and this is still the client', async () => {
		const cause = new Error('legacy boom');
		const hook = vi.fn().mockRejectedValue(cause);
		Client.plugins.registerPreLoadHook(hook, 'legacy');

		const client = new TestableClient();
		await expect(client.load({ baseUserDirectory: null })).rejects.toBe(cause);
		expect(hook.mock.instances[0]).toBe(client);
	});
});

describe('legacy plugin deprecation', () => {
	test('GIVEN a legacy hook THEN a deprecation warning is emitted once per plugin name', () => {
		const emitWarning = vi.spyOn(process, 'emitWarning').mockImplementation(() => {});
		try {
			const manager = new PluginManager();
			manager.registerPreLoadHook(vi.fn(), 'deprecation-test').registerPostListenHook(vi.fn(), 'deprecation-test');

			expect(emitWarning).toHaveBeenCalledOnce();
			expect(emitWarning).toHaveBeenCalledWith(expect.stringContaining('"deprecation-test"'), {
				type: 'DeprecationWarning',
				code: 'HTTP_FRAMEWORK_LEGACY_PLUGIN'
			});
		} finally {
			emitWarning.mockRestore();
		}
	});

	test('GIVEN a plugin object THEN no deprecation warning is emitted', () => {
		const emitWarning = vi.spyOn(process, 'emitWarning').mockImplementation(() => {});
		try {
			new PluginManager().use({ name: 'modern', preLoad() {} });
			expect(emitWarning).not.toHaveBeenCalled();
		} finally {
			emitWarning.mockRestore();
		}
	});
});
