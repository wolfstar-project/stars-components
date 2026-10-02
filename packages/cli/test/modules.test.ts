import { Diagnostic } from 'nostics';
import { applyEnvOptions, loadProject } from '../src/utils/hooks.js';
import { createFixture, type Fixture } from './helpers.js';

const MODULE_PACKAGE = {
	'node_modules/fake-module/package.json': JSON.stringify({ name: 'fake-module', type: 'module', exports: { '.': { import: './index.js' } } }),
	'node_modules/fake-module/index.js': `export default {
	meta: { name: 'fake-module', version: '1.0.0', compatibility: { framework: '>=5.0.0' } },
	defaults: { ttl: 1 },
	hooks: { 'build:before'() { (globalThis.__starsCalls ??= []).push('module hook'); } },
	setup(options, ctx) {
		ctx.addPlugin({ from: 'fake-module/plugin', options });
		ctx.addImports('fake-module');
	}
};`
};

const WITH_ENV_UTILITIES = JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } });

describe('stars modules', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
		delete (globalThis as { __starsCalls?: unknown }).__starsCalls;
	});

	test('installs a package listed in modules, merging options over its defaults', async () => {
		fixture = await createFixture({
			...MODULE_PACKAGE,
			'src/main.ts': '',
			'stars.config.mjs': "export default { modules: [['fake-module', { prefix: 'x' }]] };"
		});
		const { config } = await loadProject({ cwd: fixture.root, env: {} });

		expect(config.runtime.modules).toEqual([{ name: 'fake-module', version: '1.0.0' }]);
		expect(config.runtime.plugins).toEqual([
			{ module: 'fake-module', from: 'fake-module/plugin', export: 'default', options: { ttl: 1, prefix: 'x' } }
		]);
	});

	test('addImports extends imports.presets, and the module hooks run on the shared registry', async () => {
		fixture = await createFixture({ ...MODULE_PACKAGE, 'src/main.ts': '', 'stars.config.mjs': "export default { modules: ['fake-module'] };" });
		const { config, hooks } = await loadProject({ cwd: fixture.root, env: {} });

		expect(config.imports.presets).toEqual(['@wolfstar/http-framework', '@wolfstar/decorators', '@wolfstar/env-utilities', 'fake-module']);

		await hooks.callHook('build:before', config);
		expect((globalThis as { __starsCalls?: unknown }).__starsCalls).toEqual(['module hook']);
	});

	test('config:resolved already sees what the modules contributed', async () => {
		fixture = await createFixture({
			...MODULE_PACKAGE,
			'src/main.ts': '',
			'stars.config.mjs':
				"export default { modules: ['fake-module'], hooks: { 'config:resolved'(config) { (globalThis.__starsCalls ??= []).push(config.runtime.plugins.length); } } };"
		});
		await loadProject({ cwd: fixture.root, env: {} });
		expect((globalThis as { __starsCalls?: unknown }).__starsCalls).toEqual([1]);
	});

	test('loads a module from a path relative to the project', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'modules/local.mjs': "export default { meta: { name: 'local' }, setup: (_options, ctx) => ctx.addPlugin('./plugin.mjs') };",
			'stars.config.mjs': "export default { modules: ['./modules/local.mjs'] };"
		});
		const { config } = await loadProject({ cwd: fixture.root, env: {} });
		expect(config.runtime.modules).toEqual([{ name: 'local' }]);
	});

	test('what the modules contributed survives the re-resolve of env:options', async () => {
		fixture = await createFixture({
			...MODULE_PACKAGE,
			'src/main.ts': '',
			'package.json': WITH_ENV_UTILITIES,
			'.env': 'HTTP_PORT=4000',
			'config/.env': 'HTTP_PORT=4100',
			'stars.config.mjs': "export default { modules: ['fake-module'], hooks: { 'env:options'(options) { options.path = 'config/.env'; } } };"
		});
		const { config, hooks } = await loadProject({ cwd: fixture.root, env: {} });
		const next = await applyEnvOptions(config, hooks);

		expect(next).not.toBe(config);
		expect(next.runtime).toBe(config.runtime);
		expect(next.imports.presets).toContain('fake-module');
	});

	test('a module that is not installed fails with a MODULE_FAILED diagnostic', async () => {
		fixture = await createFixture({ 'src/main.ts': '', 'stars.config.mjs': "export default { modules: ['not-installed'] };" });
		const error = await loadProject({ cwd: fixture.root, env: {} }).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(Diagnostic);
		expect(error).toMatchObject({ code: 'MODULE_FAILED' });
		expect((error as Diagnostic).message).toContain('not-installed');
	});

	test('a module that needs another framework version fails early', async () => {
		fixture = await createFixture({
			...MODULE_PACKAGE,
			'node_modules/@wolfstar/http-framework/package.json': JSON.stringify({ name: '@wolfstar/http-framework', version: '4.0.0' }),
			'src/main.ts': '',
			'stars.config.mjs': "export default { modules: ['fake-module'] };"
		});
		const error = await loadProject({ cwd: fixture.root, env: {} }).catch((error: unknown) => error);

		expect(error).toMatchObject({ code: 'MODULE_FAILED' });
		expect((error as Diagnostic).message).toContain('>=5.0.0');
	});
});
