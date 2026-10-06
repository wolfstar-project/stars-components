import { loadStarsConfig } from '@wolfstar/schema';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { prepareProject, runPrepare } from '../src/commands/prepare.js';
import { findLegacyRootTsconfig } from '../src/utils/tsconfig.js';
import { createFixture, type Fixture } from './helpers.js';

describe('generated TypeScript configuration', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.ts': '',
			'src/lib/value.ts': 'export const value = 1;',
			'tsconfig.json': '{"extends":"./.stars/tsconfig.json"}',
			'stars.config.mjs': "export default { future: { compatibilityVersion: 5 }, build: { tool: 'tsdown' }, imports: false };"
		});
	});

	afterEach(async () => fixture.cleanup());

	test('resolves inherited aliases even when auto imports are disabled', async () => {
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect((await prepareProject(config, undefined, true)).tsconfig.status).toBe('outdated');
		await expect(readFile(join(fixture.root, '.stars/tsconfig.json'))).rejects.toMatchObject({ code: 'ENOENT' });
		await prepareProject(config);
		expect((await prepareProject(config, undefined, true)).tsconfig.status).toBe('up-to-date');
		await fixture.write(
			'src/main.ts',
			[
				"import { value as a } from '@/lib/value';",
				"import { value as b } from '~/lib/value';",
				"import { value as c } from '@@/src/lib/value';",
				"import { value as d } from '~~/src/lib/value';",
				'export const total: number = a + b + c + d;'
			].join('\n')
		);
		const tsc = join(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc');
		expect(() =>
			execFileSync(process.execPath, [tsc, '-p', join(fixture.root, 'tsconfig.json')], {
				encoding: 'utf-8'
			})
		).not.toThrow();
	});

	test('keeps the single .stars/tsconfig.json below compatibility version 6', async () => {
		const result = await prepareProject(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		expect(result.tsconfigs.map(({ name }) => name)).toEqual(['tsconfig']);
		expect(result.tsconfig.path).toBe(join(fixture.root, '.stars', 'tsconfig.json'));
		await expect(readFile(join(fixture.root, '.stars/tsconfig.app.json'))).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(readFile(join(fixture.root, '.stars/tsconfig.node.json'))).rejects.toMatchObject({ code: 'ENOENT' });
		const generated = JSON.parse(await readFile(join(fixture.root, '.stars/tsconfig.json'), 'utf-8'));
		expect(generated.compilerOptions.tsBuildInfoFile).toBe('./tsconfig.tsbuildinfo');
		expect(generated.include).toEqual(['./../src/**/*']);
	});

	test('enforces Sapphire strictness and supports legacy decorators with bundler resolution', async () => {
		await prepareProject(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		await fixture.write('src/main.ts', 'class Base { value = 1; }\nexport class Child extends Base { value = 2; }');
		const tsc = join(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc');
		const compile = () => execFileSync(process.execPath, [tsc, '-p', join(fixture.root, 'tsconfig.json')], { encoding: 'utf-8', stdio: 'pipe' });
		expect(compile).toThrow();
		await fixture.write(
			'src/main.ts',
			[
				'function property(_target: object, _key: string): void {}',
				'class Base { value = 1; }',
				'export class Child extends Base { @property override value = 2; }'
			].join('\n')
		);
		expect(compile).not.toThrow();
		const generated = JSON.parse(await readFile(join(fixture.root, '.stars/tsconfig.json'), 'utf-8'));
		expect(generated.compilerOptions).toMatchObject({
			strict: true,
			noImplicitOverride: true,
			emitDecoratorMetadata: true,
			moduleResolution: 'Bundler',
			noEmit: true
		});
	});

	test('tracks entry and custom alias changes and reports stale configuration', async () => {
		await fixture.write('app/main.ts', '');
		await fixture.write(
			'stars.config.mjs',
			"export default { future: { compatibilityVersion: 5 }, entry: 'app/main.ts', build: { tool: 'tsdown' }, imports: false, tsdown: { alias: { '@': './src', '#lib': './src/lib' } } };"
		);
		await prepareProject(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		const generated = JSON.parse(await readFile(join(fixture.root, '.stars/tsconfig.json'), 'utf-8'));
		expect(generated.compilerOptions.paths).toMatchObject({ '~/*': ['./../app/*'], '@/*': ['./../src/*'], '#lib/*': ['./../src/lib/*'] });
		await fixture.write('.stars/tsconfig.json', '{}');
		await expect(
			runPrepare({ cwd: fixture.root, check: true, json: true, stdout: { write: () => true } as NodeJS.WritableStream })
		).rejects.toMatchObject({ code: 'PREPARE_OUTDATED' });
	});

	test('generates the same ~/@/~~/@@ aliases for enableNitro builds, resolved by Vite’s own tsconfigPaths', async () => {
		await fixture.write('app/main.ts', '');
		await fixture.write(
			'stars.config.mjs',
			"export default { future: { compatibilityVersion: 5 }, entry: 'app/main.ts', build: { tool: 'vite' }, experimental: { enableVite: true, enableNitro: true }, imports: false };"
		);
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.tool).toBe('vite');
		await prepareProject(config);
		const generated = JSON.parse(await readFile(join(fixture.root, '.stars/tsconfig.json'), 'utf-8'));
		expect(generated.compilerOptions.paths).toMatchObject({
			'~/*': ['./../app/*'],
			'@/*': ['./../app/*'],
			'~~/*': ['./../*'],
			'@@/*': ['./../*']
		});
	});

	test.each(['tsdown', 'vite'])('supports Nitro-style module imports for %s', async (tool) => {
		await fixture.write(
			'stars.config.mjs',
			`export default { future: { compatibilityVersion: 5 }, build: { tool: '${tool}' }, experimental: { enableVite: true }, imports: false };`
		);
		await fixture.write('package.json', JSON.stringify({ name: 'bot', type: 'module', imports: { '#value': './src/lib/value.ts' } }));
		await fixture.write('src/helper.js', 'export const extra = 2;');
		await fixture.write('src/model.ts', 'export interface Model { value: number; }');
		await fixture.write(
			'src/main.ts',
			[
				"import { value } from '#value';",
				"import { extra } from './helper.js';",
				"import { value as explicit } from './lib/value.ts';",
				"import type { Model } from './model.ts';",
				'export const model: Model = { value: value + extra + explicit };',
				'export const request = new Request("https://example.com");'
			].join('\n')
		);
		await prepareProject(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		const tsc = join(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc');
		const compile = () => execFileSync(process.execPath, [tsc, '-p', join(fixture.root, 'tsconfig.json')], { encoding: 'utf-8', stdio: 'pipe' });
		expect(compile).not.toThrow();
		await fixture.write('src/main.ts', "import { Model } from './model.ts';\nexport const model: Model = { value: 1 };");
		expect(compile).toThrow();
	});

	test('does not advertise bundler aliases for tsc builds', async () => {
		await fixture.write('stars.config.mjs', "export default { future: { compatibilityVersion: 5 }, build: { tool: 'tsc' }, imports: false };");
		await prepareProject(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		const generated = JSON.parse(await readFile(join(fixture.root, '.stars/tsconfig.json'), 'utf-8'));
		expect(generated.compilerOptions.paths).toEqual({});
		expect(generated.compilerOptions.moduleResolution).toBe('Node16');
		expect(generated.compilerOptions.noEmit).toBeUndefined();
		expect(generated.compilerOptions.allowImportingTsExtensions).toBeUndefined();
		expect(generated.compilerOptions.verbatimModuleSyntax).toBeUndefined();
	});
});

describe('runPrepare', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.ts': '',
			'src/lib/value.ts': 'export const value = 1;',
			'stars.config.mjs':
				"export default { future: { compatibilityVersion: 5 }, build: { tool: 'tsdown' }, imports: { dirs: ['src/lib'], presets: [] } };"
		});
	});

	afterEach(async () => fixture.cleanup());

	function capture(): { stdout: NodeJS.WritableStream; text(): string } {
		let output = '';
		return {
			stdout: { write: (chunk: string) => ((output += chunk), true) } as unknown as NodeJS.WritableStream,
			text: () => output
		};
	}

	test('writes the tsconfig and the auto imports declaration, then reports both as written', async () => {
		const out = capture();

		await runPrepare({ cwd: fixture.root, stdout: out.stdout });

		expect(out.text()).toContain('tsconfig:');
		expect(out.text()).toContain('imports:');
		expect(out.text()).toContain('written');
		await expect(readFile(join(fixture.root, '.stars/tsconfig.json'), 'utf-8')).resolves.toContain('compilerOptions');
	});

	test('--check passes once written and fails when the declaration goes stale', async () => {
		await runPrepare({ cwd: fixture.root, stdout: capture().stdout });
		const out = capture();

		await runPrepare({ cwd: fixture.root, check: true, stdout: out.stdout });
		expect(out.text()).toContain('up-to-date');

		await fixture.write('src/lib/other.ts', 'export const other = 2;');
		await expect(runPrepare({ cwd: fixture.root, check: true, stdout: capture().stdout })).rejects.toMatchObject({ code: 'PREPARE_OUTDATED' });
	});
});

describe('split TypeScript configuration (compatibility version 6)', () => {
	let fixture: Fixture;
	const tsc = join(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc');
	const readGenerated = async (name: string) => JSON.parse(await readFile(join(fixture.root, '.stars', name), 'utf-8'));

	beforeEach(async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.ts': 'export const total: number = 1;',
			'src/lib/value.ts': 'export const value = 1;',
			// `types: ['node']` needs the package to resolve.
			'node_modules/@types/node/package.json': '{"name":"@types/node","version":"1.0.0","types":"index.d.ts"}',
			'node_modules/@types/node/index.d.ts': 'declare const process: { argv: string[] };',
			'scripts/seed.ts': 'export const seed: number = 1;',
			'tsconfig.json': JSON.stringify({
				files: [],
				references: [{ path: './.stars/tsconfig.app.json' }, { path: './.stars/tsconfig.node.json' }]
			}),
			'stars.config.mjs': "export default { build: { tool: 'tsdown' }, imports: false };"
		});
	});

	afterEach(async () => fixture.cleanup());

	test('writes tsconfig.app.json and tsconfig.node.json, and no tsconfig.json', async () => {
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.future.compatibilityVersion).toBe(6);

		const result = await prepareProject(config);
		expect(result.tsconfigs.map(({ name, status }) => [name, status])).toEqual([
			['app', 'written'],
			['node', 'written']
		]);
		await expect(readFile(join(fixture.root, '.stars/tsconfig.json'))).rejects.toMatchObject({ code: 'ENOENT' });

		const app = await readGenerated('tsconfig.app.json');
		expect(app.include).toEqual(['./../src/**/*']);
		expect(app.compilerOptions).toMatchObject({ moduleResolution: 'Bundler', experimentalDecorators: true, lib: ['ESNext', 'DOM'] });
		expect(app.compilerOptions.paths).toMatchObject({ '~/*': ['./../src/*'], '@@/*': ['./../*'] });

		const node = await readGenerated('tsconfig.node.json');
		expect(node.compilerOptions).toMatchObject({
			module: 'NodeNext',
			moduleResolution: 'NodeNext',
			types: ['node'],
			lib: ['ESNext'],
			strict: true
		});
		expect(node.compilerOptions.experimentalDecorators).toBeUndefined();
		expect(node.compilerOptions.paths).toBeUndefined();
		expect(node.include).toEqual(
			expect.arrayContaining(['./../stars.config.*', './../vitest.config.*', './../tsdown.config.*', './../vite.config.*', './../scripts/**/*'])
		);
		expect(node.exclude).toContain('./../src');
	});

	test('--check reports each file and fails when either is outdated, with auto imports disabled', async () => {
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect((await prepareProject(config, undefined, true)).tsconfigs.map((file) => file.status)).toEqual(['outdated', 'outdated']);
		await prepareProject(config);
		expect((await prepareProject(config, undefined, true)).tsconfigs.map((file) => file.status)).toEqual(['up-to-date', 'up-to-date']);

		await fixture.write('.stars/tsconfig.node.json', '{}');
		expect((await prepareProject(config, undefined, true)).tsconfigs.map((file) => file.status)).toEqual(['up-to-date', 'outdated']);
		await expect(
			runPrepare({ cwd: fixture.root, check: true, json: true, stdout: { write: () => true } as NodeJS.WritableStream })
		).rejects.toMatchObject({ code: 'PREPARE_OUTDATED' });
	});

	test('type-checks both projects with their own options', async () => {
		await prepareProject(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		const check = (project: string) =>
			execFileSync(process.execPath, [tsc, '-p', join(fixture.root, '.stars', project)], { encoding: 'utf-8', stdio: 'pipe' });

		expect(() => check('tsconfig.app.json')).not.toThrow();
		expect(() => check('tsconfig.node.json')).not.toThrow();

		// A DOM global is fine for the bot sources but not for the files Node runs.
		await fixture.write('src/main.ts', 'export const total: number = document.title.length;');
		await fixture.write('scripts/seed.ts', 'export const seed: number = document.title.length;');
		expect(() => check('tsconfig.app.json')).not.toThrow();
		expect(() => check('tsconfig.node.json')).toThrow();
	});

	test('keeps the node project from overlapping the entry directory', async () => {
		await fixture.write('src/main.ts', 'export const total: number = "not a number";');
		await prepareProject(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		expect(() =>
			execFileSync(process.execPath, [tsc, '-p', join(fixture.root, '.stars/tsconfig.node.json')], { encoding: 'utf-8', stdio: 'pipe' })
		).not.toThrow();
	});

	test('reports a root tsconfig.json that still extends .stars/tsconfig.json', async () => {
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		await expect(findLegacyRootTsconfig(config)).resolves.toBeNull();

		await fixture.write('tsconfig.json', '{ // generated\n\t"extends": "./.stars/tsconfig.json",\n\t"compilerOptions": {}\n}');
		await expect(findLegacyRootTsconfig(config)).resolves.toMatchObject({ code: 'TSCONFIG_LEGACY_EXTENDS' });

		// A separate file: the config loader caches a module by its path.
		await fixture.write('stars.five.mjs', "export default { build: { tool: 'tsdown' }, imports: false, future: { compatibilityVersion: 5 } };");
		const five = await loadStarsConfig({ cwd: fixture.root, configFile: 'stars.five.mjs', env: {} });
		await expect(findLegacyRootTsconfig(five)).resolves.toBeNull();
	});
});
