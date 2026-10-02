import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Diagnostic } from 'nostics';
import { reportWarnings } from '../src/commands/_shared.js';
import { prepareProject } from '../src/commands/prepare.js';
import { modulesPreloadWarning } from '../src/utils/modules.js';
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
			'modules/local.mjs':
				"export default { meta: { name: 'local' }, setup: (_options, ctx) => ctx.addPlugin(new URL('./plugin.mjs', import.meta.url)) };",
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

	describe('with a build tool the entry transform cannot reach', () => {
		const NO_BUILD = {
			...MODULE_PACKAGE,
			'node_modules/@wolfstar/http-framework/package.json': JSON.stringify({
				name: '@wolfstar/http-framework',
				version: '6.1.0',
				type: 'module',
				exports: { '.': { import: './index.js' } }
			}),
			'node_modules/@wolfstar/http-framework/index.js':
				'export const Client = { use(plugin) { (globalThis.__starsPlugins ??= []).push(plugin); } };',
			'node_modules/fake-module/plugin.js': 'export default (options) => ({ name: "fake", options });',
			'node_modules/fake-module/package.json': JSON.stringify({
				name: 'fake-module',
				type: 'module',
				exports: { '.': { import: './index.js' }, './plugin': { import: './plugin.js' } }
			}),
			'src/main.js': 'console.log(JSON.stringify(globalThis.__starsPlugins));',
			'stars.config.mjs': "export default { build: { tool: 'none' }, modules: [['fake-module', { ttl: 5 }]] };"
		};

		test.each([
			['none', true],
			['tsdown', false]
		])('%s: has a preload warning for the plugins: %s', async (tool, warns) => {
			fixture = await createFixture({
				...NO_BUILD,
				[tool === 'none' ? 'src/main.js' : 'src/main.ts']: '',
				'stars.config.mjs': `export default { build: { tool: '${tool}' }, modules: ['fake-module'] };`
			});
			const { config } = await loadProject({ cwd: fixture.root, env: {} });

			expect(modulesPreloadWarning(config)?.code ?? null).toBe(warns ? 'MODULES_PRELOAD_REQUIRED' : null);
			// `stars dev` preloads the plugins itself: the warning is about production, so it is not a config warning.
			expect(config.warnings).toEqual([]);
		});

		test('reportWarnings prints the preload warning for build and prepare, not for dev', async () => {
			fixture = await createFixture(NO_BUILD);
			const { config } = await loadProject({ cwd: fixture.root, env: {} });

			const printed = async (options?: { production?: boolean }) => {
				const lines: string[] = [];
				await reportWarnings(config, (text) => lines.push(text), options);
				return lines.join('\n');
			};
			expect(await printed()).toContain('MODULES_PRELOAD_REQUIRED');
			expect(await printed({ production: true })).toContain('MODULES_PRELOAD_REQUIRED');
			expect(await printed({ production: false })).toBe('');
		});

		test('an absolute plugin path is written as a file URL, which Node accepts on every platform', async () => {
			fixture = await createFixture({ ...NO_BUILD, 'plugin.mjs': 'export default { name: "abs" };' });
			const { config } = await loadProject({ cwd: fixture.root, env: {} });
			const plugin = join(fixture.root, 'plugin.mjs');
			const absolute = { ...config, runtime: { ...config.runtime, plugins: [{ module: 'abs', from: plugin, export: 'default' }] } };

			await prepareProject(absolute);

			const content = await readFile(join(fixture.root, '.stars/modules.mjs'), 'utf-8');
			expect(content).toContain(`import __stars_plugin_0 from ${JSON.stringify(pathToFileURL(plugin).href)};`);
		});

		test('prepare writes .stars/modules.mjs, which registers the plugins when node preloads it for production', async () => {
			fixture = await createFixture(NO_BUILD);
			const { config } = await loadProject({ cwd: fixture.root, env: {} });

			expect((await prepareProject(config, undefined, true)).modules).toEqual({
				path: join(fixture.root, '.stars/modules.mjs'),
				status: 'outdated'
			});
			expect((await prepareProject(config)).modules?.status).toBe('written');
			expect((await prepareProject(config, undefined, true)).modules?.status).toBe('up-to-date');
			expect(await readFile(join(fixture.root, '.stars/modules.mjs'), 'utf-8')).toContain('import __stars_plugin_0 from "fake-module/plugin";');

			const stdout = await new Promise<string>((resolve, reject) => {
				execFile(process.execPath, ['--import', './.stars/modules.mjs', 'src/main.js'], { cwd: fixture.root }, (error, out) =>
					error ? reject(error) : resolve(out)
				);
			});
			expect(JSON.parse(stdout)).toEqual([{ name: 'fake', options: { ttl: 5 } }]);
		});

		test('prepare writes nothing without runtime plugins', async () => {
			fixture = await createFixture({ ...NO_BUILD, 'stars.config.mjs': "export default { build: { tool: 'none' } };" });
			const { config } = await loadProject({ cwd: fixture.root, env: {} });
			expect((await prepareProject(config)).modules).toBeNull();
		});
	});
});
