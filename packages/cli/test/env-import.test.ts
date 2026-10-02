import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { envImportArgs, moduleImportArgs } from '../src/utils/env-import.js';
import { createFixture, type Fixture } from './helpers.js';

const FAKE_ENV_UTILITIES = {
	'node_modules/@wolfstar/env-utilities/package.json': JSON.stringify({ name: '@wolfstar/env-utilities', main: 'index.cjs' }),
	// Stands in for the real `setup()`: records the options it was called with.
	'node_modules/@wolfstar/env-utilities/index.cjs': 'exports.setup = (options) => { process.env.STARS_ENV_OPTIONS = JSON.stringify(options); };'
};

function config(root: string, tool: string, enabled: boolean, options = {}): ResolvedStarsConfig {
	return { root, build: { tool }, env: { enabled, options } } as unknown as ResolvedStarsConfig;
}

describe('envImportArgs', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture(FAKE_ENV_UTILITIES);
	});

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test.each(['tsdown', 'vite'])('is empty for %s, which registers env through the entry transform', (tool) => {
		expect(envImportArgs(config(fixture.root, tool, true))).toEqual([]);
	});

	test('is empty when env is disabled', () => {
		expect(envImportArgs(config(fixture.root, 'none', false))).toEqual([]);
	});

	test.each(['none', 'tsc'])('preloads env-utilities, resolved from the project, for %s', (tool) => {
		const args = envImportArgs(config(fixture.root, tool, true, { prefix: 'BOT_' }));
		expect(args[0]).toBe('--import');
		const source = decodeURIComponent(args[1]!.slice('data:text/javascript,'.length));
		const file = pathToFileURL(join(fixture.root, 'node_modules/@wolfstar/env-utilities/index.cjs')).href;
		expect(source).toBe(`import { setup } from ${JSON.stringify(file)};\nsetup({"prefix":"BOT_"});\n`);
	});

	test('node runs the preload before the entry', async () => {
		await fixture.write('src/main.js', 'console.log(process.env.STARS_ENV_OPTIONS);');
		const args = envImportArgs(config(fixture.root, 'none', true, { prefix: 'BOT_' }));
		const stdout = await new Promise<string>((resolve, reject) => {
			execFile(process.execPath, [...args, join(fixture.root, 'src/main.js')], { cwd: fixture.root }, (error, out) =>
				error ? reject(error) : resolve(out)
			);
		});
		expect(stdout.trim()).toBe('{"prefix":"BOT_"}');
	});
});

const FAKE_RUNTIME = {
	// ESM-only, like the real framework: only reachable through the `import` condition.
	'node_modules/@wolfstar/http-framework/package.json': JSON.stringify({
		name: '@wolfstar/http-framework',
		type: 'module',
		exports: { '.': { import: './index.js' } }
	}),
	'node_modules/@wolfstar/http-framework/index.js': 'export const Client = { use(plugin) { (globalThis.__starsPlugins ??= []).push(plugin); } };',
	'node_modules/fake-plugin/package.json': JSON.stringify({
		name: 'fake-plugin',
		type: 'module',
		exports: { './plugin': { import: './plugin.js' } }
	}),
	'node_modules/fake-plugin/plugin.js': 'export default (options) => ({ name: "fake", options });',
	'src/main.js': 'console.log(JSON.stringify(globalThis.__starsPlugins));'
};

function withPlugins(root: string, tool: string, plugins: object[]): ResolvedStarsConfig {
	return { root, build: { tool }, runtime: { modules: [], imports: [], plugins } } as unknown as ResolvedStarsConfig;
}

describe('moduleImportArgs', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture(FAKE_RUNTIME);
	});

	afterEach(async () => {
		await fixture?.cleanup();
	});

	const plugins = [{ module: 'fake', from: 'fake-plugin/plugin', export: 'default', options: { ttl: 5 } }];

	test.each(['tsdown', 'vite'])('is empty for %s, which registers plugins through the entry transform', (tool) => {
		expect(moduleImportArgs(withPlugins(fixture.root, tool, plugins))).toEqual([]);
	});

	test.each(['none', 'tsc'])('is empty for %s without runtime plugins', (tool) => {
		expect(moduleImportArgs(withPlugins(fixture.root, tool, []))).toEqual([]);
	});

	test('is empty when the framework is not installed, so the bot reports the missing install itself', async () => {
		const bare = await createFixture({ 'node_modules/fake-plugin/plugin.js': '' });
		try {
			expect(moduleImportArgs(withPlugins(bare.root, 'none', plugins))).toEqual([]);
		} finally {
			await bare.cleanup();
		}
	});

	test('node registers the plugins, resolved from the project, before the entry runs', async () => {
		const args = moduleImportArgs(withPlugins(fixture.root, 'none', plugins));
		expect(args[0]).toBe('--import');

		const stdout = await new Promise<string>((resolve, reject) => {
			execFile(process.execPath, [...args, join(fixture.root, 'src/main.js')], { cwd: fixture.root }, (error, out) =>
				error ? reject(error) : resolve(out)
			);
		});
		expect(JSON.parse(stdout)).toEqual([{ name: 'fake', options: { ttl: 5 } }]);
	});

	test('a plugin that cannot be resolved fails with a DEPENDENCY_MISSING diagnostic', () => {
		expect(() => moduleImportArgs(withPlugins(fixture.root, 'none', [{ module: 'x', from: 'missing-plugin', export: 'default' }]))).toThrow(
			/missing-plugin/
		);
	});
});
