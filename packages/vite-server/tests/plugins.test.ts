import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
	envModuleSource,
	modulesModuleSource,
	pluginRegistrations,
	REGISTER_PLUGIN_SOURCE,
	STARS_ENV_MODULE,
	STARS_MODULES_MODULE
} from '../src/plugins.js';

interface RegistrationPlugin {
	transform(code: string, id: string): { code: string } | null;
	resolveId(id: string): string | null;
	load(id: string): string | null;
}

let workspace: string;

beforeEach(async () => {
	workspace = await mkdtemp(join(tmpdir(), 'vite-server-plugins-'));
});

afterEach(async () => {
	await rm(workspace, { recursive: true, force: true });
});

async function write(files: Record<string, string>): Promise<void> {
	for (const [path, content] of Object.entries(files)) {
		const file = join(workspace, path);
		await mkdir(dirname(file), { recursive: true });
		await writeFile(file, content);
	}
}

function installed(name: string, packageJson: Record<string, unknown>, at = 'app'): Record<string, string> {
	return { [`${at}/node_modules/${name}/package.json`]: JSON.stringify({ name, ...packageJson }) };
}

/** The `/register` imports the plugin prepends to the application entry. */
function registrations(): string[] {
	const root = join(workspace, 'app');
	const entry = join(root, 'src/main.ts');
	const plugin = pluginRegistrations({ root, entry } as unknown as ResolvedStarsConfig) as RegistrationPlugin;
	const result = plugin.transform('', entry);
	return result ? result.code.split('\n').filter(Boolean) : [];
}

async function project(dependencies: string[], files: Record<string, string>): Promise<string[]> {
	await write({
		'app/package.json': JSON.stringify({ name: 'app', dependencies: Object.fromEntries(dependencies.map((name) => [name, '1.0.0'])) }),
		...files
	});
	return registrations();
}

describe('pluginRegistrations', () => {
	test('GIVEN a plugin exporting ./register THEN it is registered', async () => {
		const imports = await project(
			['@wolfstar/plugin-a'],
			installed('@wolfstar/plugin-a', { exports: { '.': './index.js', './register': './register.js' } })
		);
		expect(imports).toEqual(['import "@wolfstar/plugin-a/register";']);
	});

	test('GIVEN a plugin that is not installed or declares no exports THEN it is still registered', async () => {
		const imports = await project(
			['@wolfstar/plugin-missing', '@wolfstar/plugin-legacy'],
			installed('@wolfstar/plugin-legacy', { main: 'index.js' })
		);
		expect(imports).toEqual(['import "@wolfstar/plugin-legacy/register";', 'import "@wolfstar/plugin-missing/register";']);
	});

	test('GIVEN exports that only expose "." THEN the plugin is skipped', async () => {
		const imports = await project(['@wolfstar/plugin-string', '@wolfstar/plugin-conditions', '@wolfstar/plugin-array', '@wolfstar/plugin-root'], {
			...installed('@wolfstar/plugin-string', { exports: './index.js' }),
			...installed('@wolfstar/plugin-conditions', { exports: { import: './index.js', default: './index.cjs' } }),
			...installed('@wolfstar/plugin-array', { exports: ['./index.js'] }),
			...installed('@wolfstar/plugin-root', { exports: { '.': './index.js' } })
		});
		expect(imports).toEqual([]);
	});

	test('GIVEN ./register explicitly excluded with null THEN the plugin is skipped', async () => {
		const imports = await project(
			['@wolfstar/plugin-null'],
			installed('@wolfstar/plugin-null', { exports: { '.': './index.js', './register': null } })
		);
		expect(imports).toEqual([]);
	});

	test('GIVEN subpath patterns THEN the plugin is registered only when one matches ./register', async () => {
		const imports = await project(['@wolfstar/plugin-star', '@wolfstar/plugin-nested'], {
			...installed('@wolfstar/plugin-star', { exports: { '.': './index.js', './*': './dist/*.js' } }),
			...installed('@wolfstar/plugin-nested', { exports: { '.': './index.js', './lib/*': './dist/lib/*.js' } })
		});
		expect(imports).toEqual(['import "@wolfstar/plugin-star/register";']);
	});

	test('GIVEN a plugin hoisted to a parent node_modules THEN its exports are read from there', async () => {
		const imports = await project(['@wolfstar/plugin-hoisted'], installed('@wolfstar/plugin-hoisted', { exports: { '.': './index.js' } }, '.'));
		expect(imports).toEqual([]);
	});
});

describe('pluginRegistrations env', () => {
	function plugin(env: ResolvedStarsConfig['env']): RegistrationPlugin {
		const root = join(workspace, 'app');
		return pluginRegistrations({ root, entry: join(root, 'src/main.ts'), env } as unknown as ResolvedStarsConfig) as RegistrationPlugin;
	}

	const entry = () => join(workspace, 'app', 'src/main.ts');

	test('imports the env module before plugin registrations', async () => {
		await write({ 'app/package.json': JSON.stringify({ name: 'app', dependencies: { '@wolfstar/plugin-i18next': '1.0.0' } }) });
		const lines = plugin({ enabled: true, options: {} }).transform('console.log(1);', entry())!.code.split('\n');
		expect(lines.slice(0, 3)).toEqual([
			`import ${JSON.stringify(STARS_ENV_MODULE)};`,
			'import "@wolfstar/plugin-i18next/register";',
			'console.log(1);'
		]);
	});

	test('transforms the entry for env alone, without plugins', async () => {
		await write({ 'app/package.json': JSON.stringify({ name: 'app' }) });
		expect(plugin({ enabled: true, options: {} }).transform('x', entry())!.code).toBe(`import ${JSON.stringify(STARS_ENV_MODULE)};\nx`);
	});

	test('leaves the entry alone when env is disabled and there are no plugins', async () => {
		await write({ 'app/package.json': JSON.stringify({ name: 'app' }) });
		const instance = plugin({ enabled: false, options: {} });
		expect(instance.transform('x', entry())).toBeNull();
		expect(instance.resolveId(STARS_ENV_MODULE)).toBeNull();
		expect(instance.load(STARS_ENV_MODULE)).toBeNull();
	});

	test('resolves and loads the virtual module with the options as JSON', async () => {
		await write({ 'app/package.json': JSON.stringify({ name: 'app' }) });
		const instance = plugin({ enabled: true, options: { prefix: 'BOT_', path: 'config/.env' } });
		expect(instance.resolveId(STARS_ENV_MODULE)).toBe(STARS_ENV_MODULE);
		expect(instance.resolveId('other')).toBeNull();
		expect(instance.load(STARS_ENV_MODULE)).toBe(envModuleSource({ prefix: 'BOT_', path: 'config/.env' }));
		expect(instance.load('other')).toBeNull();
	});

	test('the virtual module calls setup with the options', () => {
		expect(envModuleSource({ prefix: 'BOT_' })).toBe('import { setup } from "@wolfstar/env-utilities";\nsetup({"prefix":"BOT_"});\n');
		expect(envModuleSource({}, 'file:///x/env.js')).toBe('import { setup } from "file:///x/env.js";\nsetup({});\n');
	});
});

describe('pluginRegistrations modules', () => {
	const entry = () => join(workspace, 'app', 'src/main.ts');

	function plugin(config: Partial<ResolvedStarsConfig>): RegistrationPlugin {
		const root = join(workspace, 'app');
		return pluginRegistrations({ root, entry: entry(), ...config } as unknown as ResolvedStarsConfig) as RegistrationPlugin;
	}

	const runtime = (plugins: object[]) => ({ modules: [], imports: [], plugins }) as unknown as ResolvedStarsConfig['runtime'];

	test('the virtual module registers every runtime plugin, calling factories with their options', () => {
		expect(
			modulesModuleSource([
				{ module: 'a', from: '@wolfstar/plugin-a/plugin', export: 'default' },
				{ module: 'b', from: '/pkg/b.js', export: 'plugin', options: { ttl: 5 } }
			])
		).toBe(
			[
				'import { Client } from "@wolfstar/http-framework";',
				'import __stars_plugin_0 from "@wolfstar/plugin-a/plugin";',
				'import { "plugin" as __stars_plugin_1 } from "/pkg/b.js";',
				REGISTER_PLUGIN_SOURCE,
				'__stars_register(__stars_plugin_0, undefined);',
				'__stars_register(__stars_plugin_1, {"ttl":5});',
				''
			].join('\n')
		);
	});

	test('the virtual module can point at resolved files', () => {
		const source = modulesModuleSource([{ module: 'a', from: 'a/plugin', export: 'default' }], {
			framework: 'file:///fw/index.js',
			resolve: (from) => `file:///resolved/${from}.js`
		});
		expect(source).toContain('import { Client } from "file:///fw/index.js";');
		expect(source).toContain('import __stars_plugin_0 from "file:///resolved/a/plugin.js";');
	});

	test('imports the modules module after env and before the /register imports', async () => {
		await write({ 'app/package.json': JSON.stringify({ name: 'app', dependencies: { '@wolfstar/plugin-i18next': '1.0.0' } }) });
		const instance = plugin({
			env: { enabled: true, options: {} },
			runtime: runtime([{ module: 'a', from: 'a/plugin', export: 'default' }])
		});
		expect(instance.transform('x', entry())!.code.split('\n')).toEqual([
			`import ${JSON.stringify(STARS_ENV_MODULE)};`,
			`import ${JSON.stringify(STARS_MODULES_MODULE)};`,
			'import "@wolfstar/plugin-i18next/register";',
			'x'
		]);
	});

	test('resolves and loads the virtual module only when there are runtime plugins', async () => {
		await write({ 'app/package.json': JSON.stringify({ name: 'app' }) });
		const plugins = [{ module: 'a', from: 'a/plugin', export: 'default' }];
		const active = plugin({ runtime: runtime(plugins) });
		expect(active.resolveId(STARS_MODULES_MODULE)).toBe(STARS_MODULES_MODULE);
		expect(active.load(STARS_MODULES_MODULE)).toBe(modulesModuleSource(plugins as never));

		const idle = plugin({ runtime: runtime([]) });
		expect(idle.resolveId(STARS_MODULES_MODULE)).toBeNull();
		expect(idle.load(STARS_MODULES_MODULE)).toBeNull();
		expect(idle.transform('x', entry())).toBeNull();
	});

	test('a package listed in modules is no longer activated through its /register import', async () => {
		const imports = await project(['@wolfstar/plugin-a', '@wolfstar/plugin-b'], {});
		expect(imports).toEqual(['import "@wolfstar/plugin-a/register";', 'import "@wolfstar/plugin-b/register";']);

		const root = join(workspace, 'app');
		const instance = pluginRegistrations({
			root,
			entry: entry(),
			modules: [{ specifier: '@wolfstar/plugin-a', options: {} }]
		} as unknown as ResolvedStarsConfig) as RegistrationPlugin;
		expect(instance.transform('', entry())!.code.split('\n').filter(Boolean)).toEqual(['import "@wolfstar/plugin-b/register";']);
	});

	test('a package installed by another module is not activated through /register either', async () => {
		await write({
			'app/package.json': JSON.stringify({
				name: 'app',
				dependencies: { '@wolfstar/plugin-a': '1', '@wolfstar/plugin-b': '1', '@wolfstar/plugin-c': '1' }
			})
		});
		const instance = plugin({
			// `a` is listed; `b` was installed as a dependency of `a`; `c` is not a module at all.
			modules: [{ specifier: '@wolfstar/plugin-a', options: {} }],
			runtime: { modules: [{ name: '@wolfstar/plugin-b' }, { name: '@wolfstar/plugin-a' }], imports: [], plugins: [] }
		} as unknown as Partial<ResolvedStarsConfig>);
		expect(instance.transform('', entry())!.code.split('\n').filter(Boolean)).toEqual(['import "@wolfstar/plugin-c/register";']);
	});
});

describe('REGISTER_PLUGIN_SOURCE', () => {
	function register(plugin: unknown, options?: unknown) {
		const used: unknown[] = [];
		const run = new Function('Client', `${REGISTER_PLUGIN_SOURCE}\nreturn __stars_register;`) as (
			client: object
		) => (plugin: unknown, options: unknown) => void;
		run({ use: (value: unknown) => void used.push(value) })(plugin, options);
		return used;
	}

	test('passes a plugin object as it is', () => {
		const plugin = { name: 'object' };
		expect(register(plugin)).toEqual([plugin]);
	});

	test('calls a factory function with the options', () => {
		expect(register((options: unknown) => ({ name: 'factory', options }), { ttl: 1 })).toEqual([{ name: 'factory', options: { ttl: 1 } }]);
	});

	test('passes a legacy Plugin class as it is, without calling it', () => {
		class Legacy {
			public static name2 = 'legacy';
		}
		expect(register(Legacy)).toEqual([Legacy]);
	});
});
