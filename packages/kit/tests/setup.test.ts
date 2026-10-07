import type { ResolvedStarsConfig, StarsHookName } from '@wolfstar/schema';
import { ModuleError, defineModule, mergeOptions, setupModules, type ModuleHookHost, type StarsModule } from '../src/index.js';

function host() {
	const registered: [string, unknown][] = [];
	const called: [string, unknown[]][] = [];
	const hooks: ModuleHookHost = {
		hook: (name: StarsHookName, callback: unknown) => void registered.push([name, callback]),
		callHook: async (name: StarsHookName, ...args: unknown[]) => void called.push([name, args])
	} as ModuleHookHost;
	return { hooks, registered, called };
}

function run(
	modules: StarsModule<any>[] | Record<string, unknown>,
	entries: [string, Record<string, unknown>?][],
	versions = {},
	moduleOptions: Record<string, unknown> = {}
) {
	const loaded = Array.isArray(modules) ? Object.fromEntries(modules.map((module) => [module.meta.name, module])) : modules;
	const { hooks, registered, called } = host();
	const config = {
		root: '/app',
		moduleOptions,
		modules: entries.map(([specifier, options]) => ({ specifier, options: options ?? {} }))
	} as unknown as ResolvedStarsConfig;
	return {
		registered,
		called,
		result: setupModules({
			config,
			hooks,
			versions,
			load: async (specifier) => {
				if (!(specifier in loaded)) throw new Error(`Cannot find ${specifier}`);
				return { default: loaded[specifier] };
			}
		})
	};
}

describe('defineModule', () => {
	test('returns the definition unchanged', () => {
		const definition = { meta: { name: 'a' } };
		expect(defineModule(definition)).toBe(definition);
	});
});

describe('mergeOptions', () => {
	test('user options win, objects merge deeply, arrays and undefined behave', () => {
		expect(mergeOptions({ ttl: 1, nested: { a: 1, b: 2 }, list: [1], keep: true }, { nested: { b: 3 }, list: [2], keep: undefined })).toEqual({
			ttl: 1,
			nested: { a: 1, b: 3 },
			list: [2],
			keep: true
		});
	});
});

describe('setupModules', () => {
	test('GIVEN no modules THEN the runtime is empty', async () => {
		expect(await run([], []).result).toEqual({ modules: [], plugins: [], imports: [], configKeys: [] });
	});

	test('GIVEN defaults and user options THEN setup receives them merged', async () => {
		const setup = vi.fn();
		const { result } = run(
			[defineModule<{ ttl: number; prefix?: string }>({ meta: { name: 'cache' }, defaults: { ttl: 60_000 }, setup })],
			[['cache', { prefix: 'x' }]]
		);
		await result;
		expect(setup).toHaveBeenCalledExactlyOnceWith({ ttl: 60_000, prefix: 'x' }, expect.objectContaining({ root: '/app' }));
	});

	describe('meta.configKey', () => {
		const tasks = (setup = vi.fn(), extra: Partial<StarsModule<any>> = {}) =>
			defineModule<{ concurrency: number; bull: { host: string; port: number }; prefix?: string }>({
				meta: { name: 'tasks', configKey: 'scheduledTasks' },
				defaults: { concurrency: 1, bull: { host: 'localhost', port: 6379 } },
				setup,
				...extra
			} as StarsModule<any>);

		test('GIVEN a configKey THEN setup receives defaults, then the config key, then the inline options', async () => {
			const setup = vi.fn();
			const { result } = run(
				[tasks(setup)],
				[['tasks', { bull: { port: 1 }, prefix: 'inline' }]],
				{},
				{ scheduledTasks: { concurrency: 4, bull: { host: 'redis', port: 7000 }, prefix: 'key' } }
			);
			await result;
			expect(setup).toHaveBeenCalledExactlyOnceWith({ concurrency: 4, bull: { host: 'redis', port: 1 }, prefix: 'inline' }, expect.anything());
		});

		test('GIVEN a configKey and no value in the config THEN setup receives the defaults and the inline options', async () => {
			const setup = vi.fn();
			await run([tasks(setup)], [['tasks', { concurrency: 2 }]]).result;
			expect(setup).toHaveBeenCalledExactlyOnceWith({ concurrency: 2, bull: { host: 'localhost', port: 6379 } }, expect.anything());
		});

		test('GIVEN a value under a key no module declares THEN it is left alone', async () => {
			const setup = vi.fn();
			const { result } = run([defineModule({ meta: { name: 'plain' }, setup })], [['plain']], {}, { scheduledTasks: { concurrency: 9 } });
			expect(await result).toMatchObject({ configKeys: [] });
			expect(setup).toHaveBeenCalledExactlyOnceWith({}, expect.anything());
		});

		test('GIVEN a configKey THEN it is reported as claimed, once per module', async () => {
			const other = defineModule({ meta: { name: 'other', configKey: 'other' } });
			const { result } = run([tasks(), other], [['tasks'], ['other'], ['tasks']], {}, { other: {} });
			expect(await result).toMatchObject({ modules: [{ name: 'tasks' }, { name: 'other' }], configKeys: ['scheduledTasks', 'other'] });
		});

		test('GIVEN two modules with the same configKey THEN it throws MODULE_INVALID naming both', async () => {
			const rival = defineModule({ meta: { name: 'rival', configKey: 'scheduledTasks' } });
			const { result } = run([tasks(), rival], [['tasks'], ['rival']]);
			await expect(result).rejects.toMatchObject({ code: 'MODULE_INVALID', moduleName: 'rival' });
			await expect(result).rejects.toThrow(/"tasks" and "rival" both declare the `configKey` "scheduledTasks"/);
		});

		test.each(['build', 'dev', 'modules', 'tsdown'])(
			'GIVEN the built-in key %s as configKey THEN it throws MODULE_INVALID',
			async (configKey) => {
				const { result } = run([defineModule({ meta: { name: 'greedy', configKey } })], [['greedy']]);
				await expect(result).rejects.toMatchObject({ code: 'MODULE_INVALID', moduleName: 'greedy' });
				await expect(result).rejects.toThrow(/built-in key/);
			}
		);

		test.each([
			['an empty string', ''],
			['a number', 1]
		])('GIVEN %s as configKey THEN it throws MODULE_INVALID', async (_name, configKey) => {
			const { result } = run([{ meta: { name: 'odd', configKey } } as unknown as StarsModule], [['odd']]);
			await expect(result).rejects.toMatchObject({ code: 'MODULE_INVALID', moduleName: 'odd' });
			await expect(result).rejects.toThrow(/non-empty string/);
		});

		test.each([
			['an array', [], 'an array'],
			['a string', 'redis', 'a string'],
			['null', null, 'null']
		])('GIVEN %s under the configKey THEN it throws MODULE_INVALID', async (_name, value, described) => {
			const { result } = run([tasks()], [['tasks']], {}, { scheduledTasks: value });
			await expect(result).rejects.toMatchObject({ code: 'MODULE_INVALID', moduleName: 'tasks' });
			await expect(result).rejects.toThrow(new RegExp(`must be an object, got ${described}`));
		});

		test('GIVEN a module installed as a dependency THEN its configKey is read, with no inline options', async () => {
			const setup = vi.fn();
			const parent = defineModule({ meta: { name: 'parent' }, dependencies: [tasks(setup)] });
			const { result } = run([parent], [['parent']], {}, { scheduledTasks: { concurrency: 3 } });
			expect(await result).toMatchObject({ configKeys: ['scheduledTasks'] });
			expect(setup).toHaveBeenCalledExactlyOnceWith({ concurrency: 3, bull: { host: 'localhost', port: 6379 } }, expect.anything());
		});

		test('GIVEN ctx.installModule THEN the options passed take the inline slot over the config key', async () => {
			const setup = vi.fn();
			const parent = defineModule({ meta: { name: 'parent' }, setup: (_options, ctx) => ctx.installModule(tasks(setup), { concurrency: 8 }) });
			const { result } = run([parent], [['parent']], {}, { scheduledTasks: { concurrency: 3, prefix: 'key' } });
			await result;
			expect(setup).toHaveBeenCalledExactlyOnceWith(
				{ concurrency: 8, bull: { host: 'localhost', port: 6379 }, prefix: 'key' },
				expect.anything()
			);
		});

		test('GIVEN a module skipped because it is installed THEN its key is not read again', async () => {
			const setup = vi.fn();
			const { result } = run(
				[tasks(setup)],
				[
					['tasks', { concurrency: 2 }],
					['tasks', { concurrency: 9 }]
				],
				{},
				{ scheduledTasks: { prefix: 'key' } }
			);
			await result;
			expect(setup).toHaveBeenCalledExactlyOnceWith(
				{ concurrency: 2, bull: { host: 'localhost', port: 6379 }, prefix: 'key' },
				expect.anything()
			);
		});
	});

	test('GIVEN addPlugin and addImports THEN they are collected with the module name', async () => {
		const { result } = run(
			[
				defineModule({
					meta: { name: 'cache', version: '1.2.3' },
					setup(_options, ctx) {
						ctx.addPlugin('cache/plugin');
						ctx.addPlugin({ from: new URL('file:///pkg/runtime.js'), export: 'plugin', options: { ttl: 5 } });
						ctx.addImports('cache');
						ctx.addImports({ from: 'cache' });
						ctx.addImports({ from: 'other' });
					}
				})
			],
			[['cache']]
		);

		expect(await result).toEqual({
			modules: [{ name: 'cache', version: '1.2.3' }],
			plugins: [
				{ module: 'cache', from: 'cache/plugin', export: 'default' },
				{ module: 'cache', from: '/pkg/runtime.js', export: 'plugin', options: { ttl: 5 } }
			],
			imports: ['cache', 'other'],
			configKeys: []
		});
	});

	test('GIVEN a plugin with options that are not JSON THEN it throws MODULE_PLUGIN_INVALID', async () => {
		const { result } = run(
			[defineModule({ meta: { name: 'bad' }, setup: (_options, ctx) => ctx.addPlugin({ from: 'x', options: { fn() {} } }) })],
			[['bad']]
		);
		await expect(result).rejects.toMatchObject({ code: 'MODULE_PLUGIN_INVALID', moduleName: 'bad' });
	});

	test.each(['./plugin.js', '../plugin.js', '.\\plugin.js', '.'])(
		'GIVEN a relative plugin path %s THEN it throws MODULE_PLUGIN_INVALID',
		async (from) => {
			const { result } = run([defineModule({ meta: { name: 'rel' }, setup: (_options, ctx) => ctx.addPlugin(from) })], [['rel']]);
			await expect(result).rejects.toMatchObject({ code: 'MODULE_PLUGIN_INVALID', moduleName: 'rel' });
			await expect(result).rejects.toThrow(/relative/);
		}
	);

	test.each([
		['an unknown hook name', { 'build:finished': () => {} }],
		['a hook that is not a function', { 'build:done': 'nope' }]
	])('GIVEN %s in hooks THEN it throws MODULE_INVALID', async (_name, hooks) => {
		const { result } = run([{ meta: { name: 'hooked' }, hooks } as unknown as StarsModule], [['hooked']]);
		await expect(result).rejects.toMatchObject({ code: 'MODULE_INVALID', moduleName: 'hooked' });
	});

	test('GIVEN hooks and ctx.hook THEN they are registered on the host and callHook delegates', async () => {
		const hook = vi.fn();
		const { result, registered, called } = run(
			[
				defineModule({
					meta: { name: 'h' },
					hooks: { 'build:done': hook },
					async setup(_options, ctx) {
						ctx.hook('dev:start', hook);
						await ctx.callHook('dev:close', {} as never);
					}
				})
			],
			[['h']]
		);
		await result;
		expect(registered).toEqual([
			['build:done', hook],
			['dev:start', hook]
		]);
		expect(called.map(([name]) => name)).toEqual(['dev:close']);
	});

	test('GIVEN dependencies and installModule THEN they are installed once, before the dependent, first wins', async () => {
		const order: string[] = [];
		const base = defineModule({ meta: { name: 'base' }, setup: () => void order.push('base') });
		const child = defineModule({ meta: { name: 'child' }, dependencies: ['base'], setup: () => void order.push('child') });
		const other = defineModule({
			meta: { name: 'other' },
			async setup(_options, ctx) {
				await ctx.installModule('base');
				order.push('other');
			}
		});

		const { result } = run([base, child, other], [['child'], ['other'], ['base']]);
		const runtime = await result;

		expect(order).toEqual(['base', 'child', 'other']);
		expect(runtime.modules.map((module) => module.name)).toEqual(['base', 'child', 'other']);
	});

	test('GIVEN a dependency cycle THEN installation terminates', async () => {
		const a = defineModule({ meta: { name: 'a' }, dependencies: ['b'] });
		const b = defineModule({ meta: { name: 'b' }, dependencies: ['a'] });
		const runtime = await run([a, b], [['a']]).result;
		expect(runtime.modules.map((module) => module.name)).toEqual(['b', 'a']);
	});

	test('GIVEN inline module objects in installModule THEN they are installed too', async () => {
		const setup = vi.fn();
		const host = defineModule({
			meta: { name: 'host' },
			setup: (_options, ctx) => ctx.installModule(defineModule({ meta: { name: 'inline' }, defaults: { a: 1 }, setup }), { b: 2 })
		});
		await run([host], [['host']]).result;
		expect(setup).toHaveBeenCalledWith({ a: 1, b: 2 }, expect.anything());
	});

	test.each([
		['a module that cannot be loaded', { missing: undefined }, [['missing']], 'MODULE_LOAD_FAILED'],
		['an export that is not a module', { odd: { nope: true } }, [['odd']], 'MODULE_INVALID'],
		['a module without a name', { odd: { meta: {} } }, [['odd']], 'MODULE_INVALID']
	] as const)('GIVEN %s THEN it throws %s', async (_name, modules, entries, code) => {
		const loaded = Object.fromEntries(Object.entries(modules).filter(([, value]) => value !== undefined));
		const promise = run(loaded, entries.map((entry) => [...entry]) as [string][]).result;
		await expect(promise).rejects.toBeInstanceOf(ModuleError);
		await expect(promise).rejects.toMatchObject({ code });
	});

	test('GIVEN a setup that throws THEN it is wrapped in MODULE_SETUP_FAILED with the cause', async () => {
		const cause = new Error('boom');
		const { result } = run(
			[
				defineModule({
					meta: { name: 'thrower' },
					setup() {
						throw cause;
					}
				})
			],
			[['thrower']]
		);
		await expect(result).rejects.toMatchObject({ code: 'MODULE_SETUP_FAILED', moduleName: 'thrower', cause });
	});

	test('GIVEN compatibility ranges THEN a mismatch fails early and a match or unknown version passes', async () => {
		const module = defineModule({ meta: { name: 'compat', compatibility: { framework: '>=5.0.0' } } });
		await expect(run([module], [['compat']], { framework: '4.9.0' }).result).rejects.toMatchObject({ code: 'MODULE_INCOMPATIBLE' });
		await expect(run([module], [['compat']], { framework: '6.0.1' }).result).resolves.toBeDefined();
		await expect(run([module], [['compat']], { framework: null }).result).resolves.toBeDefined();
	});
});
