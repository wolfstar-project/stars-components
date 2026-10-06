import { Diagnostic } from 'nostics';
import { BUILT_IN_CONFIG_KEYS, EMPTY_MODULES_RUNTIME, assertModuleOptionsClaimed, loadStarsConfig } from '../../src/index.js';
import { createFixture, type Fixture } from './helpers.js';

describe('stars.config modules', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	async function load(modules: string) {
		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': `export default { modules: ${modules} };` });
		return loadStarsConfig({ cwd: fixture.root, env: {} });
	}

	async function loadError(modules: string): Promise<Diagnostic> {
		const error = await load(modules).catch((error: unknown) => error);
		expect(error).toBeInstanceOf(Diagnostic);
		return error as Diagnostic;
	}

	test('defaults to no modules and an empty runtime', async () => {
		fixture = await createFixture({ 'src/main.js': '' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.modules).toEqual([]);
		expect(config.runtime).toEqual(EMPTY_MODULES_RUNTIME);
	});

	test('normalises names and [name, options] tuples', async () => {
		const config = await load("['@wolfstar/plugin-cache', ['@wolfstar/plugin-gateway', { shards: 2 }], ['./local.mjs']]");
		expect(config.modules).toEqual([
			{ specifier: '@wolfstar/plugin-cache', options: {} },
			{ specifier: '@wolfstar/plugin-gateway', options: { shards: 2 } },
			{ specifier: './local.mjs', options: {} }
		]);
	});

	test('drops falsy entries, so a conditional module can be listed inline', async () => {
		const config = await load("[false, null, undefined, process.env.NOPE && '@wolfstar/b', '@wolfstar/a']");
		expect(config.modules.map((entry) => entry.specifier)).toEqual(['@wolfstar/a']);
	});

	test.each([
		['a string instead of an array', "'@wolfstar/a'"],
		['a number entry', '[1]'],
		['options that are not an object', "[['@wolfstar/a', 'nope']]"],
		['a tuple without a specifier', '[[{}]]'],
		['a tuple with more than a specifier and options', "[['@wolfstar/a', {}, 'extra']]"]
	])('rejects %s', async (_name, modules) => {
		const error = await loadError(modules);
		expect(error.message).toContain('modules');
		expect(error.message).toContain('must be');
	});

	describe('module options', () => {
		async function loadConfig(source: string) {
			fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': `export default ${source};` });
			return loadStarsConfig({ cwd: fixture.root, env: {} });
		}

		test('GIVEN no extra key THEN moduleOptions is empty', async () => {
			expect((await loadConfig("{ modules: ['@wolfstar/a'], dev: { debounce: 10 } }")).moduleOptions).toEqual({});
		});

		test('GIVEN a top-level key that is not built in THEN it is kept aside as written, not rejected', async () => {
			const config = await loadConfig("{ modules: ['@wolfstar/a'], scheduledTasks: { bull: { connection: { port: 6379 } } }, other: false }");
			expect(config.moduleOptions).toEqual({ scheduledTasks: { bull: { connection: { port: 6379 } } }, other: false });
			expect(config.modules.map((entry) => entry.specifier)).toEqual(['@wolfstar/a']);
		});

		test('GIVEN a key set to undefined THEN it counts as absent', async () => {
			expect((await loadConfig('{ scheduledTasks: undefined }')).moduleOptions).toEqual({});
		});

		test('GIVEN a built-in key THEN it is never part of moduleOptions, and its own validation still applies', async () => {
			const config = await loadConfig('{ dev: { debounce: 10 } }');
			for (const key of BUILT_IN_CONFIG_KEYS) expect(config.moduleOptions).not.toHaveProperty(key);
			await expect(loadConfig("{ dev: { debounce: 'fast' } }")).rejects.toMatchObject({ code: 'INVALID_TYPE' });
		});

		test('GIVEN a moduleOptions record THEN it is frozen', async () => {
			expect(Object.isFrozen((await loadConfig('{ scheduledTasks: {} }')).moduleOptions)).toBe(true);
		});

		test('GIVEN an unclaimed key THEN assertModuleOptionsClaimed throws UNKNOWN_OPTION listing built-in and claimed keys', async () => {
			const config = await loadConfig('{ scheduledTask: {}, cache: {} }');
			let error: unknown;
			try {
				assertModuleOptionsClaimed(config, ['cache', 'scheduledTasks']);
			} catch (caught) {
				error = caught;
			}

			expect(error).toBeInstanceOf(Diagnostic);
			expect(error).toMatchObject({ code: 'UNKNOWN_OPTION' });
			expect((error as Diagnostic).message).toContain('scheduledTask');
			expect((error as Diagnostic).fix).toContain('cache, scheduledTasks');
			expect((error as Diagnostic).fix).toContain('listed in `modules`');
		});

		test('GIVEN every extra key claimed, or none THEN assertModuleOptionsClaimed passes', async () => {
			const config = await loadConfig('{ cache: {} }');
			expect(() => assertModuleOptionsClaimed(config, ['cache'])).not.toThrow();
			expect(() => assertModuleOptionsClaimed({ configFile: null, moduleOptions: {} }, [])).not.toThrow();
		});
	});
});
