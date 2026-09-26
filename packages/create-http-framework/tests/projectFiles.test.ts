import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	buildDependencies,
	buildDevDependencies,
	buildScripts,
	packageJson,
	writeProjectFiles,
	type ProjectContext
} from '../src/tools/projectFiles.js';

/** Fixed version for every package name that `projectFiles.ts` may look up, keyed by npm package name. */
const versions: ProjectContext['versions'] = {
	'@wolfstar/http-framework': '1.0.0',
	'@wolfstar/cli': '1.0.0',
	'discord-api-types': '1.0.0',
	'@wolfstar/env-utilities': '1.0.0',
	'@wolfstar/start-banner': '1.0.0',
	'gradient-string': '1.0.0',
	'@wolfstar/plugin-i18next': '1.0.0',
	'@wolfstar/i18next-type-generator': '1.0.0',
	'@types/node': '1.0.0',
	typescript: '1.0.0',
	tsdown: '1.0.0',
	eslint: '1.0.0',
	'typescript-eslint': '1.0.0',
	'@eslint/js': '1.0.0',
	oxlint: '1.0.0',
	prettier: '1.0.0',
	oxfmt: '1.0.0',
	vitest: '1.0.0',
	'@wolfstar/http-framework-test-utils': '1.0.0',
	'@wolfstar/plugin-gateway': '1.0.0',
	'@wolfstar/plugin-cache': '1.0.0',
	'@wolfstar/plugin-sharder': '1.0.0',
	ioredis: '1.0.0',
	vite: '1.0.0',
	nitro: '3.0.0-beta'
};

function makeContext(overrides: Partial<ProjectContext> = {}): ProjectContext {
	return {
		name: 'test-project',
		port: 3000,
		i18n: false,
		subcommands: false,
		subcommandsAdvanced: false,
		testing: false,
		gateway: false,
		cache: false,
		redis: false,
		sharder: false,
		packageManager: 'pnpm',
		language: 'ts',
		buildTool: 'tsdown',
		linter: 'oxlint',
		formatter: 'oxfmt',
		versions,
		...overrides
	};
}

describe('buildDependencies', () => {
	test('GIVEN i18n enabled THEN includes @wolfstar/plugin-i18next but not @wolfstar/http-framework-i18n', () => {
		const dependencies = buildDependencies(makeContext({ i18n: true }));

		expect(dependencies).toHaveProperty('@wolfstar/plugin-i18next');
		expect(dependencies).not.toHaveProperty('@wolfstar/http-framework-i18n');
	});

	test('GIVEN i18n disabled THEN excludes @wolfstar/plugin-i18next', () => {
		const dependencies = buildDependencies(makeContext({ i18n: false }));

		expect(dependencies).not.toHaveProperty('@wolfstar/plugin-i18next');
	});

	test.each([
		makeContext(),
		makeContext({ i18n: true }),
		makeContext({ subcommands: true }),
		makeContext({ testing: true }),
		makeContext({ language: 'js' }),
		makeContext({ language: 'js', i18n: true, subcommands: true, testing: true })
	])('GIVEN any combination THEN never includes @discordjs/builders', (ctx) => {
		const dependencies = buildDependencies(ctx);

		expect(dependencies).not.toHaveProperty('@discordjs/builders');
	});

	test.each([makeContext(), makeContext({ language: 'js' }), makeContext({ i18n: true, subcommands: true, testing: true })])(
		'GIVEN any combination THEN always includes the shared runtime dependencies',
		(ctx) => {
			const dependencies = buildDependencies(ctx);

			expect(dependencies).toHaveProperty('@wolfstar/env-utilities');
			expect(dependencies).toHaveProperty('@wolfstar/start-banner');
			expect(dependencies).toHaveProperty('gradient-string');
		}
	);
});

describe('buildDevDependencies', () => {
	test('GIVEN i18n enabled THEN includes @wolfstar/i18next-type-generator', () => {
		const dev = buildDevDependencies(makeContext({ i18n: true }));

		expect(dev).toHaveProperty('@wolfstar/i18next-type-generator');
	});

	test('GIVEN i18n disabled THEN excludes @wolfstar/i18next-type-generator', () => {
		const dev = buildDevDependencies(makeContext({ i18n: false }));

		expect(dev).not.toHaveProperty('@wolfstar/i18next-type-generator');
	});

	test('GIVEN testing enabled THEN includes vitest and @wolfstar/http-framework-test-utils', () => {
		const dev = buildDevDependencies(makeContext({ testing: true }));

		expect(dev).toHaveProperty('vitest');
		expect(dev).toHaveProperty('@wolfstar/http-framework-test-utils');
	});

	test('GIVEN testing disabled THEN excludes vitest and @wolfstar/http-framework-test-utils', () => {
		const dev = buildDevDependencies(makeContext({ testing: false }));

		expect(dev).not.toHaveProperty('vitest');
		expect(dev).not.toHaveProperty('@wolfstar/http-framework-test-utils');
	});

	test('GIVEN JavaScript with no linter/formatter/i18n/testing THEN only @wolfstar/cli remains', () => {
		const dev = buildDevDependencies(makeContext({ language: 'js', linter: 'none', formatter: 'none' }));

		expect(dev).toStrictEqual({ '@wolfstar/cli': '^1.0.0' });
	});

	test.each([
		makeContext({ language: 'js' }),
		makeContext({ language: 'ts', buildTool: 'tsdown' }),
		makeContext({ language: 'ts', buildTool: 'tsc6' })
	])('GIVEN any project kind THEN includes @wolfstar/cli and never tsc-watch', (ctx) => {
		const dev = buildDevDependencies(ctx);

		expect(dev['@wolfstar/cli']).toBe('^1.0.0');
		expect(dev).not.toHaveProperty('tsc-watch');
	});
});

describe('buildScripts', () => {
	test('GIVEN i18n enabled THEN adds the generate:i18n script', () => {
		const scripts = buildScripts(makeContext({ i18n: true }));

		expect(scripts['generate:i18n']).toBe('stars codegen');
	});

	test('GIVEN i18n disabled THEN omits the generate:i18n script', () => {
		const scripts = buildScripts(makeContext({ i18n: false }));

		expect(scripts).not.toHaveProperty('generate:i18n');
	});

	test('GIVEN testing enabled THEN adds a test script running vitest', () => {
		const scripts = buildScripts(makeContext({ testing: true }));

		expect(scripts['test']).toBe('vitest run');
	});

	test('GIVEN testing disabled THEN omits the test script', () => {
		const scripts = buildScripts(makeContext({ testing: false }));

		expect(scripts).not.toHaveProperty('test');
	});

	test('GIVEN JavaScript THEN start runs main.js directly from src, dev uses stars and there is no build', () => {
		const scripts = buildScripts(makeContext({ language: 'js' }));

		expect(scripts['start']).toBe('node src/main.js');
		expect(scripts['dev']).toBe('stars dev');
		expect(scripts).not.toHaveProperty('build');
	});

	test.each(['tsdown', 'tsc6', 'tsc7'] as const)('GIVEN TypeScript with %s THEN dev/build use stars and start runs dist/main.js', (buildTool) => {
		const scripts = buildScripts(makeContext({ language: 'ts', buildTool }));

		expect(scripts['dev']).toBe('stars dev');
		expect(scripts['build']).toBe('stars build');
		expect(scripts['start']).toBe('node dist/main.js');
		expect(scripts).not.toHaveProperty('watch');
		expect(scripts).not.toHaveProperty('watch:start');
	});
});

describe('packageJson', () => {
	test('GIVEN TypeScript THEN main points at dist/main.js', () => {
		const parsed = JSON.parse(packageJson(makeContext({ language: 'ts' })));

		expect(parsed.main).toBe('dist/main.js');
	});

	test('GIVEN JavaScript THEN main points at src/main.js', () => {
		const parsed = JSON.parse(packageJson(makeContext({ language: 'js' })));

		expect(parsed.main).toBe('src/main.js');
	});

	test('GIVEN JavaScript with no linter/formatter/i18n/testing THEN devDependencies only holds @wolfstar/cli', () => {
		const parsed = JSON.parse(packageJson(makeContext({ language: 'js', linter: 'none', formatter: 'none' })));

		expect(parsed.devDependencies).toStrictEqual({ '@wolfstar/cli': '^1.0.0' });
	});

	test('GIVEN TypeScript THEN devDependencies is present (at least @types/node and typescript)', () => {
		const parsed = JSON.parse(packageJson(makeContext({ language: 'ts' })));

		expect(parsed.devDependencies).toHaveProperty('@types/node');
		expect(parsed.devDependencies).toHaveProperty('typescript');
	});

	test('GIVEN dependencies THEN always includes the shared runtime dependencies and never @discordjs/builders', () => {
		const parsed = JSON.parse(packageJson(makeContext()));

		expect(parsed.dependencies).toHaveProperty('@wolfstar/env-utilities');
		expect(parsed.dependencies).toHaveProperty('@wolfstar/start-banner');
		expect(parsed.dependencies).toHaveProperty('gradient-string');
		expect(parsed.dependencies).not.toHaveProperty('@discordjs/builders');
	});
});

describe('writeProjectFiles', () => {
	let target: string;

	beforeEach(async () => {
		target = await mkdtemp(join(tmpdir(), 'create-http-framework-'));
	});

	afterEach(async () => {
		await rm(target, { recursive: true, force: true });
	});

	test('GIVEN tsdown THEN the build lives in stars.config.ts and needs no options of its own', async () => {
		writeProjectFiles(target, makeContext({ language: 'ts', buildTool: 'tsdown' }));

		const config = await readFile(join(target, 'stars.config.ts'), 'utf-8');
		expect(config).toContain('defineConfig({})');
		// The defaults cover a base project, so there is no `tsdown` block and no `tsdown.config.ts` either.
		expect(config).not.toContain('tsdown:');
		await expect(readFile(join(target, 'tsdown.config.ts'), 'utf-8')).rejects.toMatchObject({ code: 'ENOENT' });

		const tsconfig = JSON.parse(await readFile(join(target, 'tsconfig.json'), 'utf-8'));
		// The auto imports declaration file is only typed if the tsconfig can see it.
		expect(tsconfig.include).toContain('.stars/*.d.ts');
		expect(tsconfig.extends).toBe('./.stars/tsconfig.json');
		const packageJson = JSON.parse(await readFile(join(target, 'package.json'), 'utf-8'));
		expect(packageJson.scripts.postinstall).toBe('stars prepare');
		expect(tsconfig.compilerOptions.paths).toBeUndefined();
	});

	test('GIVEN tsc THEN stars.config.ts only selects tsc', async () => {
		writeProjectFiles(target, makeContext({ language: 'ts', buildTool: 'tsc7' }));

		const config = await readFile(join(target, 'stars.config.ts'), 'utf-8');
		expect(config).toContain("defineConfig({ build: { tool: 'tsc' } })");
		expect(config).not.toContain('compatibilityVersion');
		expect(config).not.toContain('tsdown:');
	});
});

describe('gateway features', () => {
	test.each([
		['gateway', { gateway: true }, ['@wolfstar/plugin-gateway'], ['@wolfstar/plugin-cache', '@wolfstar/plugin-sharder', 'ioredis']],
		['cache', { gateway: true, cache: true }, ['@wolfstar/plugin-gateway', '@wolfstar/plugin-cache'], ['ioredis']],
		['redis', { gateway: true, cache: true, redis: true }, ['@wolfstar/plugin-cache', 'ioredis'], ['@wolfstar/plugin-sharder']],
		['sharder', { gateway: true, sharder: true }, ['@wolfstar/plugin-gateway', '@wolfstar/plugin-sharder'], ['@wolfstar/plugin-cache', 'ioredis']]
	] as const)('GIVEN the %s feature THEN lists only its own dependencies', (_name, features, expected, unexpected) => {
		const dependencies = buildDependencies(makeContext(features));

		for (const name of expected) expect(dependencies).toHaveProperty(name);
		for (const name of unexpected) expect(dependencies).not.toHaveProperty(name);
	});

	test('GIVEN the gateway THEN engines.node requires the version @wolfstar/plugin-gateway needs', () => {
		expect(JSON.parse(packageJson(makeContext({ gateway: true }))).engines.node).toBe('>=24.17.0');
		expect(JSON.parse(packageJson(makeContext())).engines.node).toBe('>=20');
	});
});

describe('vite build tools', () => {
	test('GIVEN vite THEN builds with vite, keeps dist/main.js and needs neither tsdown nor nitro', () => {
		const ctx = makeContext({ buildTool: 'vite' });
		const parsed = JSON.parse(packageJson(ctx));

		expect(parsed.main).toBe('dist/main.js');
		expect(parsed.scripts.start).toBe('node dist/main.js');
		expect(parsed.scripts.postinstall).toBe('stars prepare');
		expect(parsed.devDependencies).toHaveProperty('vite', '^1.0.0');
		expect(parsed.devDependencies).not.toHaveProperty('nitro');
		expect(parsed.devDependencies).not.toHaveProperty('tsdown');
	});

	test('GIVEN vite-nitro THEN runs the Nitro output and pins the beta exactly', () => {
		const parsed = JSON.parse(packageJson(makeContext({ buildTool: 'vite-nitro' })));

		expect(parsed.main).toBe('.output/server/index.mjs');
		expect(parsed.scripts.start).toBe('node .output/server/index.mjs');
		expect(parsed.devDependencies).toHaveProperty('vite', '^1.0.0');
		expect(parsed.devDependencies).toHaveProperty('nitro', '3.0.0-beta');
	});

	test('GIVEN a JavaScript project THEN vite-nitro changes nothing', () => {
		const parsed = JSON.parse(packageJson(makeContext({ language: 'js', buildTool: 'vite-nitro' })));

		expect(parsed.main).toBe('src/main.js');
		expect(parsed.devDependencies).not.toHaveProperty('vite');
		expect(parsed.devDependencies).not.toHaveProperty('nitro');
	});

	describe('writeProjectFiles', () => {
		let target: string;

		beforeEach(async () => {
			target = await mkdtemp(join(tmpdir(), 'create-http-framework-'));
		});

		afterEach(async () => {
			await rm(target, { recursive: true, force: true });
		});

		test('GIVEN vite THEN stars.config.ts enables Vite and selects it as the build tool', async () => {
			writeProjectFiles(target, makeContext({ buildTool: 'vite' }));

			const config = await readFile(join(target, 'stars.config.ts'), 'utf-8');
			expect(config).toContain("build: { tool: 'vite' }");
			expect(config).toContain('experimental: { enableVite: true }');
			expect(config).not.toContain('enableNitro');

			const tsconfig = JSON.parse(await readFile(join(target, 'tsconfig.json'), 'utf-8'));
			expect(tsconfig.extends).toBe('./.stars/tsconfig.json');
			expect(tsconfig.include).toContain('.stars/*.d.ts');
		});

		test('GIVEN vite-nitro THEN stars.config.ts also enables Nitro, which needs Vite, with the node-server preset', async () => {
			writeProjectFiles(target, makeContext({ buildTool: 'vite-nitro' }));

			const config = await readFile(join(target, 'stars.config.ts'), 'utf-8');
			expect(config).toContain('enableVite: true');
			expect(config).toContain('enableNitro: true');
			expect(config).toContain("preset: 'node-server'");
		});

		test('GIVEN JavaScript THEN a vite selection never reaches stars.config.js', async () => {
			writeProjectFiles(target, makeContext({ language: 'js', buildTool: 'vite-nitro' }));

			const config = await readFile(join(target, 'stars.config.js'), 'utf-8');
			expect(config).toContain('defineConfig({})');
		});
	});
});
