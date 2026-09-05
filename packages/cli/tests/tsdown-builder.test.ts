import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { TsdownBuilder } from '../src/lib/builders/tsdown.js';

const TSDOWN_PACKAGE = dirname(createRequire(import.meta.url).resolve('tsdown/package.json'));

/**
 * A project the builder can actually build: `tsdown` is resolved from the project root through the project's own
 * `node_modules` (see `importFromProject`), so the fixture links it there. It cannot live under this package's
 * `node_modules` the way the Vite builder's fixture does — the auto imports scan skips `node_modules`, so the
 * directories it is pointed at would come back empty.
 */
async function createFixture(files: Record<string, string>): Promise<{ root: string; cleanup(): Promise<void> }> {
	const root = await mkdtemp(join(tmpdir(), 'stars-tsdown-'));
	await mkdir(join(root, 'node_modules'), { recursive: true });
	await symlink(TSDOWN_PACKAGE, join(root, 'node_modules', 'tsdown'), 'junction');

	for (const [path, content] of Object.entries(files)) {
		const file = join(root, path);
		await mkdir(dirname(file), { recursive: true });
		await writeFile(file, content);
	}

	return { root, cleanup: () => rm(root, { recursive: true, force: true }) };
}

const PACKAGE_JSON = JSON.stringify({ name: 'tsdown-fixture', type: 'module', main: 'dist/main.js' });

function run(file: string): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile(process.execPath, [file], (error, stdout) => (error ? reject(error) : resolve(stdout)));
	});
}

describe('TsdownBuilder', () => {
	let fixture: { root: string; cleanup(): Promise<void> };

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('builds from stars.config alone at compatibility version 4, with no tsdown.config.*', async () => {
		fixture = await createFixture({
			'package.json': PACKAGE_JSON,
			'stars.config.mjs': "export default { entry: 'src/main.ts', imports: false, future: { compatibilityVersion: 4 } };",
			'src/main.ts': "import { greet } from './lib/greet.js';\nconsole.log(greet('bot'));\n",
			'src/lib/greet.ts': 'export function greet(name: string): string {\n\treturn `hello ${name}`;\n}\n'
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.configFile).toBeNull();

		const builder = new TsdownBuilder(config);
		const started = new Promise<void>((resolve) => builder.once('start', resolve));
		const [outcome] = await Promise.all([builder.build(), started]);

		expect(outcome).toMatchObject({ ok: true, message: null });
		// Unbundled, so the entry keeps its name and the pieces next to it stay loadable from `dist` at runtime.
		expect(await run(config.build.output)).toContain('hello bot');
		expect(await run(join(fixture.root, 'dist', 'lib', 'greet.js'))).toBe('');
	});

	test('resolves the `~`/`@` alias prefixes, and keeps a project’s own aliases next to them', async () => {
		fixture = await createFixture({
			'package.json': PACKAGE_JSON,
			'stars.config.mjs':
				"export default { entry: 'src/main.ts', imports: false, future: { compatibilityVersion: 4 }, tsdown: { alias: { '#shared': './src/lib' } } };",
			'src/main.ts':
				"import { greet } from '~/lib/greet';\nimport { greet as at } from '@/lib/greet';\nimport { name } from '~~/bot';\nimport { greet as shared } from '#shared/greet';\nconsole.log(greet(name), at('at'), shared('shared'));\n",
			'src/lib/greet.ts': 'export function greet(name: string): string {\n\treturn `hello ${name}`;\n}\n',
			// Outside the source directory on purpose: `~~`/`@@` point at the project root, the way Nuxt's do.
			'bot.ts': "export const name = 'bot';\n"
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const outcome = await new TsdownBuilder(config).build();

		expect(outcome).toMatchObject({ ok: true, message: null });
		expect(await run(config.build.output)).toContain('hello bot hello at hello shared');
	});

	test('injects the auto imports plugin when imports are enabled', async () => {
		fixture = await createFixture({
			'package.json': PACKAGE_JSON,
			'stars.config.mjs':
				"export default { entry: 'src/main.ts', future: { compatibilityVersion: 4 }, imports: { dirs: ['src/lib'], presets: [] } };",
			// `greet` is never imported: the transform is what makes this build at all.
			'src/main.ts': "console.log(greet('bot'));\n",
			'src/lib/greet.ts': 'export function greet(name: string): string {\n\treturn `hello ${name}`;\n}\n'
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.imports.enabled).toBe(true);

		const outcome = await new TsdownBuilder(config).build();
		expect(outcome).toMatchObject({ ok: true, message: null });
		expect(await run(config.build.output)).toContain('hello bot');
	});

	test('merges the `tsdown` block over the project’s own tsdown.config.* at compatibility version 3', async () => {
		fixture = await createFixture({
			'package.json': PACKAGE_JSON,
			// A plain `.mjs` config keeps the fixture independent of which TypeScript loader `tsdown` picks.
			'tsdown.config.mjs':
				"export default { entry: ['src/main.ts'], format: 'esm', outDir: 'dist', outExtensions: () => ({ js: '.js' }), define: { __FROM__: '\"file\"', __ONLY_FILE__: '\"file-only\"' } };\n",
			'stars.config.mjs': "export default { entry: 'src/main.ts', tsdown: { define: { __FROM__: '\"stars\"' } } };",
			'src/main.ts': 'declare const __FROM__: string;\ndeclare const __ONLY_FILE__: string;\nconsole.log(__FROM__, __ONLY_FILE__);\n'
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.configFile).toBe(join(fixture.root, 'tsdown.config.mjs'));

		const outcome = await new TsdownBuilder(config).build();
		expect(outcome).toMatchObject({ ok: true, message: null });
		// `stars.config` wins on the option they both set, and the file keeps the ones it alone declares.
		expect(await run(config.build.output)).toContain('stars file-only');
	});

	test('reports a failed build instead of throwing', async () => {
		fixture = await createFixture({
			'package.json': PACKAGE_JSON,
			'stars.config.mjs': "export default { entry: 'src/main.ts', imports: false, future: { compatibilityVersion: 4 } };",
			'src/main.ts': "import { missing } from './nope.js';\nconsole.log(missing);\n"
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new TsdownBuilder(config);
		const failed = new Promise<void>((resolve) => builder.once('failure', () => resolve()));

		const [outcome] = await Promise.all([builder.build(), failed]);
		expect(outcome.ok).toBe(false);
		expect(outcome.message).toBeTruthy();
	});

	// Same libuv fs-event limitation as the other watch tests — see the comment in builders.test.ts.
	test.skipIf(process.platform === 'win32')('watch() rebuilds on change and reports through the same events', async () => {
		fixture = await createFixture({
			'package.json': PACKAGE_JSON,
			'stars.config.mjs': "export default { entry: 'src/main.ts', imports: false, future: { compatibilityVersion: 4 } };",
			'src/main.ts': "console.log('v1');\n"
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new TsdownBuilder(config);
		const successes: number[] = [];
		builder.on('success', (outcome) => successes.push(outcome.durationMs));

		await new Promise<void>((resolve) => {
			builder.once('success', () => resolve());
			void builder.watch();
		});
		expect(successes).toHaveLength(1);

		await writeFile(join(fixture.root, 'src', 'main.ts'), "console.log('v2');\n");
		await new Promise<void>((resolve) => builder.once('success', () => resolve()));
		expect(await run(config.build.output)).toContain('v2');

		await builder.close();
	});
});
