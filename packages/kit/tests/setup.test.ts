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

function run(modules: StarsModule<any>[] | Record<string, unknown>, entries: [string, Record<string, unknown>?][], versions = {}) {
	const loaded = Array.isArray(modules) ? Object.fromEntries(modules.map((module) => [module.meta.name, module])) : modules;
	const { hooks, registered, called } = host();
	const config = {
		root: '/app',
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
