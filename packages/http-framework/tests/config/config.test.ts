import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CONFIG_FILE_NAMES, ConfigError, defineConfig, discoverConfigFile, loadStarsConfig } from '../../src/config.js';
import { createFixture, type Fixture } from './helpers.js';

const PACKAGE_JSON = JSON.stringify({ name: 'bot', version: '1.2.3', main: 'dist/main.js' });

describe('stars.config', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('defineConfig returns the configuration untouched', () => {
		const config = { entry: 'src/main.ts' };
		expect(defineConfig(config)).toBe(config);
	});

	test.each([
		[undefined, null],
		['MY BOT\nCustom banner', ['MY BOT', 'Custom banner']],
		[['MY BOT'], ['MY BOT']],
		[false, false]
	])('resolves dev.banner %j', async (banner, expected) => {
		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': `export default ${JSON.stringify({ dev: { banner } })}` });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.banner).toEqual(expected);
	});

	test('rejects invalid dev.banner values', async () => {
		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': 'export default { dev: { banner: true } }' });
		await expect(loadStarsConfig({ cwd: fixture.root, env: {} })).rejects.toThrow('dev.banner');
	});

	test('discovers stars.config.* in the documented order', async () => {
		fixture = await createFixture({ 'stars.config.js': 'export default {};', 'stars.config.ts': 'export default {};' });
		expect(CONFIG_FILE_NAMES[0]).toBe('stars.config.ts');
		expect(discoverConfigFile(fixture.root)).toBe(join(fixture.root, 'stars.config.ts'));
	});

	test('runs on defaults without a configuration file', async () => {
		fixture = await createFixture({ 'src/main.js': '', 'package.json': '{ "name": "bot" }' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

		expect(config.configFile).toBeNull();
		expect(config.root).toBe(fixture.root);
		expect(config.entry).toBe(join(fixture.root, 'src', 'main.js'));
		expect(config.build).toEqual({ tool: 'none', outDir: join(fixture.root, 'dist'), tsconfig: null, output: config.entry, configFile: null });
		expect(config.future.compatibilityVersion).toBe(3);
		expect(config.dev.watch).toEqual([join(fixture.root, 'src')]);
		expect(config.dev.debounce).toBe(150);
		expect(config.dev.nodeArgs).toEqual(['--enable-source-maps']);
		// Mirrors Vite's/Nuxt's dev servers: a URL is always shown, even with no config and no HTTP_PORT set.
		expect(config.dev.url).toBe('http://localhost:3000');
		expect(config.codegen.i18n).toBeNull();
		// The build tool is 'none' here, and auto imports need `tsdown`'s transform.
		expect(config.imports.enabled).toBe(false);
		expect(config.imports.dirs).toEqual([join(fixture.root, 'src', 'lib', '**'), join(fixture.root, 'src', 'utils', '**')]);
		expect(config.imports.presets).toEqual(['@wolfstar/http-framework', '@wolfstar/env-utilities']);
		expect(config.imports.dts).toBe(join(fixture.root, '.stars', 'imports.d.ts'));
	});

	test('enables auto imports by default from compatibility version 4 on', async () => {
		// At 3 the `autoImports()` plugin is the project's own to add, so defaulting them on would promise imports
		// that never get injected.
		fixture = await createFixture({ 'src/main.ts': '', 'tsdown.config.ts': 'export default {};' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).imports.enabled).toBe(false);
		await fixture.cleanup();

		fixture = await createFixture({
			'src/main.ts': '',
			'stars.config.mjs': 'export default { future: { compatibilityVersion: 4 } };'
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.tool).toBe('tsdown');
		expect(config.imports.enabled).toBe(true);
	});

	test('compatibility version 4 builds tsdown from stars.config alone', async () => {
		// No `tsdown.config.*` and no `tsdown` dependency: a TypeScript entry is enough to pick the bundler, and the
		// build carries no configuration file of its own for the builder to load.
		fixture = await createFixture({
			'src/main.ts': '',
			'stars.config.mjs': 'export default { future: { compatibilityVersion: 4 }, tsdown: { minify: true } };'
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.tool).toBe('tsdown');
		expect(config.build.configFile).toBeNull();
		expect(config.tsdown).toEqual({ minify: true });
	});

	test('keeps a tsdown.config.* authoritative at compatibility version 3', async () => {
		fixture = await createFixture({ 'src/main.ts': '', 'tsdown.config.ts': 'export default {};' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.tool).toBe('tsdown');
		expect(config.build.configFile).toBe(join(fixture.root, 'tsdown.config.ts'));
	});

	test('resolves the tsconfig for a tsdown build, not just a tsc one', async () => {
		// `tsdown` only looks next to the project root, so the `src/tsconfig.json` layout needs resolving here.
		fixture = await createFixture({
			'src/main.ts': '',
			'src/tsconfig.json': '{}',
			'stars.config.mjs': 'export default { future: { compatibilityVersion: 4 } };'
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).build.tsconfig).toBe(join(fixture.root, 'src', 'tsconfig.json'));
		await fixture.cleanup();

		// Unlike `tsc`, a `tsdown` build without one is fine: it simply gets no tsconfig.
		fixture = await createFixture({ 'src/main.ts': '', 'stars.config.mjs': 'export default { future: { compatibilityVersion: 4 } };' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).build.tsconfig).toBeNull();
	});

	test('detects tsdown from a `tsdown` block alone', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'stars.config.mjs': "export default { tsdown: { target: 'node22' } };"
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).build.tool).toBe('tsdown');
	});

	test('honours an explicit `imports` configuration', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsdown.config.ts': 'export default {};',
			'stars.config.mjs':
				"export default { imports: { dirs: ['src/shared'], presets: [], exclude: ['container'], dts: 'types/imports.d.ts' } };"
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.imports).toEqual({
			enabled: false,
			dirs: [join(fixture.root, 'src', 'shared')],
			presets: [],
			exclude: ['container'],
			dts: join(fixture.root, 'types', 'imports.d.ts')
		});
	});

	test('resolves dev.typecheck, dev.tunnel and dev.logFile', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'stars.config.mjs':
				"export default { build: { tool: 'tsc' }, dev: { typecheck: true, tunnel: { url: 'https://bot.example.com', path: '/interactions', updateEndpoint: true } } };"
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.dev.typecheck).toEqual({ enabled: true, tsconfig: join(fixture.root, 'tsconfig.json'), checker: 'tsc' });
		expect(config.dev.tunnel).toEqual({ mode: 'url', url: 'https://bot.example.com', path: '/interactions', updateEndpoint: true });
		expect(config.dev.logFile).toBe(join(fixture.root, '.stars', 'dev.log'));
	});

	test('defaults dev.typecheck and dev.tunnel off, and dev.logFile can be disabled', async () => {
		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': 'export default { dev: { tunnel: true, logFile: false } };' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

		expect(config.dev.typecheck).toEqual({ enabled: false, tsconfig: null, checker: 'tsc' });
		expect(config.dev.tunnel).toEqual({ mode: 'quick', path: '/', updateEndpoint: false });
		expect(config.dev.logFile).toBeNull();
	});

	test('picks the type checker: golar when the project depends on it, otherwise tsc', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'package.json': JSON.stringify({ name: 'bot', devDependencies: { golar: '^0.1.10' } }),
			'stars.config.mjs': "export default { build: { tool: 'tsc' }, dev: { typecheck: true } };"
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.typecheck.checker).toBe('golar');
		await fixture.cleanup();

		// An explicit checker always wins over the detection. A fresh fixture avoids the config loader's module cache.
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'package.json': JSON.stringify({ name: 'bot', devDependencies: { golar: '^0.1.10' } }),
			'stars.config.mjs': "export default { build: { tool: 'tsc' }, dev: { typecheck: { checker: 'tsz' } } };"
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.typecheck.checker).toBe('tsz');
	});

	test('defaults every experimental flag to false', async () => {
		fixture = await createFixture({ 'src/main.js': '', 'package.json': '{ "name": "bot" }' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).experimental).toEqual({
			enableVite: false,
			enableExternalVite: false,
			enableNitro: false,
			nitro: { preset: 'node-server' }
		});
	});

	test('detects vite as the build tool only once `experimental.enableVite` is on', async () => {
		fixture = await createFixture({ 'src/main.ts': '', 'tsconfig.json': '{}', 'vite.config.ts': 'export default {};' });
		// Without the flag a vite.config.* belongs to something else in the project and must not take the build over.
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).build.tool).toBe('tsc');
		await fixture.cleanup();

		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'vite.config.ts': 'export default {};',
			'stars.config.mjs': 'export default { experimental: { enableVite: true } };'
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.tool).toBe('vite');
		expect(config.experimental.enableVite).toBe(true);
	});

	test('enableNitro outputs to .output/server/index.mjs and needs enableVite', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'stars.config.mjs': "export default { experimental: { enableVite: true, enableNitro: true, nitro: { preset: 'cloudflare-module' } } };"
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.outDir).toBe(join(fixture.root, '.output'));
		expect(config.build.output).toBe(join(fixture.root, '.output', 'server', 'index.mjs'));
		expect(config.experimental.nitro.preset).toBe('cloudflare-module');
	});

	test('passes `vite`/`tsdown` through as plain objects', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsdown.config.ts': 'export default {};',
			'stars.config.mjs': 'export default { tsdown: { minify: true } };'
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).tsdown).toEqual({ minify: true });
		await fixture.cleanup();

		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'vite.config.ts': 'export default {};',
			'stars.config.mjs': "export default { experimental: { enableVite: true }, vite: { define: { FOO: '1' } } };"
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).vite).toEqual({ define: { FOO: '1' } });
	});

	test('disables auto imports with `imports: false`', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsdown.config.ts': 'export default {};',
			'stars.config.mjs': 'export default { imports: false };'
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).imports.enabled).toBe(false);
	});

	test('loads a TypeScript configuration file that uses defineConfig', async () => {
		fixture = await createFixture({ 'src/main.ts': '', 'tsconfig.json': '{}', 'package.json': PACKAGE_JSON });
		const configModule = pathToFileURL(join(import.meta.dirname, '..', '..', 'src', 'config.ts')).href;
		await fixture.write(
			'stars.config.ts',
			`import { defineConfig } from '${configModule}';\nexport default defineConfig({ build: { tool: 'tsc' }, dev: { debounce: 10, env: { HTTP_PORT: '4000' } } });`
		);

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.configFile).toBe(join(fixture.root, 'stars.config.ts'));
		expect(config.build.tool).toBe('tsc');
		expect(config.build.tsconfig).toBe(join(fixture.root, 'tsconfig.json'));
		expect(config.build.output).toBe(join(fixture.root, 'dist', 'main.js'));
		expect(config.dev.debounce).toBe(10);
		expect(config.dev.url).toBe('http://localhost:4000');
		expect(config.packageJson?.name).toBe('bot');
	});

	test('resolves paths relative to the configuration file, not the working directory', async () => {
		fixture = await createFixture({
			'app/src/main.js': '',
			'config/stars.config.mjs': "export default { root: '../app', dev: { watch: ['src', 'assets'] } };"
		});

		const config = await loadStarsConfig({ cwd: fixture.root, configFile: 'config/stars.config.mjs', env: {} });
		expect(config.root).toBe(join(fixture.root, 'app'));
		expect(config.entry).toBe(join(fixture.root, 'app', 'src', 'main.js'));
		expect(config.dev.watch).toEqual([join(fixture.root, 'app', 'src'), join(fixture.root, 'app', 'assets')]);
	});

	test('falls back to HTTP_PORT (or PORT) from .env.local or .env when nothing else sets it', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'DISCORD_TOKEN=x\nHTTP_PORT=4100\n' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:4100');
		await fixture.cleanup();

		fixture = await createFixture({ 'src/main.js': '', '.env': 'PORT=4200\n' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:4200');
		await fixture.cleanup();

		// .env.local takes priority over .env, matching dotenv's own precedence.
		fixture = await createFixture({ 'src/main.js': '', '.env': 'HTTP_PORT=4200\n', '.env.local': 'HTTP_PORT=4300\n' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:4300');

		// An explicit HTTP_PORT (env var or `dev.env`) still wins over the .env file.
		expect((await loadStarsConfig({ cwd: fixture.root, env: { HTTP_PORT: '4400' } })).dev.url).toBe('http://localhost:4400');
	});

	test('detects tsdown from the configuration file or the dependencies', async () => {
		fixture = await createFixture({ 'src/main.ts': '', 'tsdown.config.ts': 'export default {};' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).build.tool).toBe('tsdown');
		await fixture.cleanup();

		fixture = await createFixture({ 'src/main.ts': '', 'package.json': JSON.stringify({ devDependencies: { tsdown: '^0.22.0' } }) });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.tool).toBe('tsdown');
		expect(config.build.output).toBe(join(fixture.root, 'dist', 'main.js'));
	});

	test('maps .mts entries to .mjs outputs when package.json has no main', async () => {
		fixture = await createFixture({ 'src/main.mts': '', 'tsconfig.json': '{}', 'stars.config.mjs': "export default { entry: 'src/main.mts' };" });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.tool).toBe('tsc');
		expect(config.build.output).toBe(join(fixture.root, 'dist', 'main.mjs'));
	});

	test('auto-detects i18n codegen from the locales directory', async () => {
		fixture = await createFixture({ 'src/main.js': '', 'src/locales/en-US/commands/shared.json': '{}' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.codegen.i18n).toEqual({
			locales: join(fixture.root, 'src', 'locales', 'en-US'),
			output: join(fixture.root, 'src', '@types', 'i18next.d.ts')
		});

		await fixture.write('stars.config.mjs', 'export default { codegen: { i18n: false } };');
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).codegen.i18n).toBeNull();
	});

	describe('validation', () => {
		async function expectConfigError(content: string, files: Record<string, string> = { 'src/main.js': '' }) {
			fixture = await createFixture({ ...files, 'stars.config.mjs': content });
			const error = await loadStarsConfig({ cwd: fixture.root, env: {} }).then(
				() => null,
				(caught: unknown) => caught
			);
			expect(error).toBeInstanceOf(ConfigError);
			expect((error as ConfigError).file).toBe(join(fixture.root, 'stars.config.mjs'));
			expect((error as ConfigError).hint).toBeTruthy();
			await fixture.cleanup();
			return error as ConfigError;
		}

		test('rejects a missing --config file', async () => {
			fixture = await createFixture();
			await expect(loadStarsConfig({ cwd: fixture.root, configFile: 'nope.ts' })).rejects.toMatchObject({ code: 'CONFIG_NOT_FOUND' });
		});

		test('rejects a file that does not export an object', async () => {
			const error = await expectConfigError('export default 42;');
			expect(error.code).toBe('CONFIG_NOT_OBJECT');
		});

		test('reports syntax errors with the file', async () => {
			const error = await expectConfigError('export default {');
			expect(error.code).toBe('CONFIG_LOAD_FAILED');
		});

		test('rejects unknown options with the known ones in the hint', async () => {
			const error = await expectConfigError("export default { dev: { watchh: ['src'] } };");
			expect(error).toMatchObject({ code: 'UNKNOWN_OPTION', path: 'dev.watchh' });
			expect(error.hint).toContain('watch');
		});

		test('rejects wrong types with the option path', async () => {
			const error = await expectConfigError("export default { dev: { debounce: 'fast' } };");
			expect(error).toMatchObject({ code: 'INVALID_TYPE', path: 'dev.debounce' });
			expect(error.message).toContain('"fast"');
		});

		test('rejects a missing entry', async () => {
			const error = await expectConfigError("export default { entry: 'src/nope.ts' };");
			expect(error).toMatchObject({ code: 'ENTRY_NOT_FOUND', path: 'entry' });
			expect((await expectConfigError('export default {};', {})).code).toBe('ENTRY_NOT_FOUND');
		});

		test('rejects build.tool none for TypeScript entries and unknown tools', async () => {
			expect((await expectConfigError("export default { build: { tool: 'none' } };", { 'src/main.ts': '' })).code).toBe('BUILD_TOOL_REQUIRED');
			expect((await expectConfigError("export default { build: { tool: 'webpack' } };")).code).toBe('INVALID_BUILD_TOOL');
		});

		test('rejects tsc without a tsconfig', async () => {
			expect((await expectConfigError("export default { build: { tool: 'tsc' } };", { 'src/main.ts': '' })).code).toBe('TSCONFIG_NOT_FOUND');
		});

		test('rejects invalid urls', async () => {
			expect((await expectConfigError("export default { dev: { url: 'localhost' } };")).code).toBe('INVALID_URL');
		});

		test('rejects a tunnel URL that is not https', async () => {
			expect((await expectConfigError("export default { dev: { tunnel: 'http://bot.example.com' } };")).code).toBe('INVALID_URL');
			expect((await expectConfigError("export default { dev: { tunnel: 'nope' } };")).code).toBe('INVALID_URL');
		});

		test('rejects `build.tool: vite` without the experiment, and unknown experiments', async () => {
			const error = await expectConfigError("export default { build: { tool: 'vite' } };");
			expect(error).toMatchObject({ code: 'EXPERIMENT_REQUIRED', path: 'build.tool' });
			expect(error.hint).toContain('experimental.enableVite');

			expect((await expectConfigError('export default { experimental: { enableTurbo: true } };')).code).toBe('UNKNOWN_OPTION');
			expect((await expectConfigError("export default { experimental: { enableVite: 'yes' } };")).code).toBe('INVALID_TYPE');
		});

		test('rejects `enableExternalVite`/`enableNitro`/`nitro` without their prerequisite', async () => {
			expect((await expectConfigError('export default { experimental: { enableExternalVite: true } };')).path).toBe(
				'experimental.enableExternalVite'
			);
			expect((await expectConfigError('export default { experimental: { enableNitro: true } };')).path).toBe('experimental.enableNitro');
			expect((await expectConfigError("export default { experimental: { enableVite: true, nitro: { preset: 'bun' } } };")).path).toBe(
				'experimental.nitro'
			);
		});

		test('rejects an unknown compatibility version and unknown `future` options', async () => {
			const error = await expectConfigError('export default { future: { compatibilityVersion: 5 } };');
			expect(error).toMatchObject({ code: 'INVALID_COMPATIBILITY_VERSION', path: 'future.compatibilityVersion' });
			expect(error.hint).toContain('4');

			expect((await expectConfigError("export default { future: { compatibilityVersion: '4' } };")).code).toBe('INVALID_COMPATIBILITY_VERSION');
			expect((await expectConfigError('export default { future: { compatVersion: 4 } };')).code).toBe('UNKNOWN_OPTION');
			expect((await expectConfigError('export default { future: 4 };')).code).toBe('INVALID_TYPE');
		});

		test('rejects a tsdown.config.* at compatibility version 4', async () => {
			const error = await expectConfigError('export default { future: { compatibilityVersion: 4 } };', {
				'src/main.ts': '',
				'tsdown.config.ts': 'export default {};'
			});
			expect(error).toMatchObject({ code: 'TSDOWN_CONFIG_FILE_UNSUPPORTED', path: 'tsdown' });
			expect(error.hint).toContain('compatibilityVersion');

			// `tsdown` reads `package.json#tsdown` as well, so that counts as a configuration file too.
			expect(
				(
					await expectConfigError('export default { future: { compatibilityVersion: 4 } };', {
						'src/main.ts': '',
						'package.json': JSON.stringify({ name: 'bot', tsdown: { minify: true } })
					})
				).code
			).toBe('TSDOWN_CONFIG_FILE_UNSUPPORTED');
		});

		test('rejects `tsdown`/`vite` options that do not match the build tool', async () => {
			const tsdown = await expectConfigError("export default { build: { tool: 'none' }, tsdown: { minify: true } };");
			expect(tsdown).toMatchObject({ code: 'TSDOWN_OPTIONS_REQUIRE_TSDOWN', path: 'tsdown' });

			const vite = await expectConfigError('export default { vite: { define: {} } };', {
				'src/main.ts': '',
				'tsdown.config.ts': 'export default {};'
			});
			expect(vite).toMatchObject({ code: 'VITE_OPTIONS_REQUIRE_VITE', path: 'vite' });
		});

		test('rejects an unknown type checker', async () => {
			const error = await expectConfigError("export default { dev: { typecheck: { checker: 'tsgo' } } };");
			expect(error).toMatchObject({ code: 'INVALID_TYPECHECKER', path: 'dev.typecheck.checker' });
			expect(error.hint).toContain('golar');
		});

		test('rejects a typecheck tsconfig that does not exist', async () => {
			const error = await expectConfigError("export default { dev: { typecheck: { tsconfig: 'nope.json' } } };");
			expect(error).toMatchObject({ code: 'TSCONFIG_NOT_FOUND', path: 'dev.typecheck.tsconfig' });
		});

		test('rejects `imports: true` and `imports.enabled: true` without the tsdown build tool', async () => {
			expect((await expectConfigError('export default { imports: true };')).code).toBe('IMPORTS_REQUIRE_TSDOWN');
			expect((await expectConfigError('export default { imports: { enabled: true } };')).code).toBe('IMPORTS_REQUIRE_TSDOWN');
		});

		test('rejects an invalid `imports` value', async () => {
			expect((await expectConfigError('export default { imports: 42 };')).code).toBe('INVALID_TYPE');
			expect((await expectConfigError("export default { imports: { enabled: 'yes' } };")).code).toBe('INVALID_TYPE');
			expect((await expectConfigError('export default { imports: { dirss: [] } };')).code).toBe('UNKNOWN_OPTION');
		});
	});
});
