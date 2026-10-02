import { Diagnostic } from 'nostics';
import { EMPTY_MODULES_RUNTIME, loadStarsConfig } from '../../src/index.js';
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
});
