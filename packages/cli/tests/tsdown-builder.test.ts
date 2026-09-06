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
		const logs: { level: string; text: string }[] = [];
		builder.on('log', (level, text) => logs.push({ level, text }));
		const started = new Promise<void>((resolve) => builder.once('start', resolve));
		const [outcome] = await Promise.all([builder.build(), started]);

		expect(outcome).toMatchObject({ ok: true, message: null });
		// Unbundled, so the entry keeps its name and the pieces next to it stay loadable from `dist` at runtime.
		expect(await run(config.build.output)).toContain('hello bot');
		expect(await run(join(fixture.root, 'dist', 'lib', 'greet.js'))).toBe('');
		// The CLI owns progress/success output instead of repeating tsdown's entry list and output table.
		expect(logs.every(({ level }) => level === 'warn' || level === 'error')).toBe(true);
		expect(logs.some(({ text }) => text.includes('skipNodeModulesBundle'))).toBe(false);
	});

	test('keeps dependencies external so dynamically loaded classes share their runtime identity', async () => {
		fixture = await createFixture({
			'package.json': PACKAGE_JSON,
			'stars.config.mjs': "export default { entry: 'src/main.ts', imports: false, future: { compatibilityVersion: 4 } };",
			'node_modules/piece-base/package.json': JSON.stringify({ name: 'piece-base', type: 'module', exports: './index.js' }),
			'node_modules/piece-base/index.js': 'export class Piece {}\n',
			'src/main.ts':
				"import { Piece } from 'piece-base';\nimport { UserPiece } from './commands/ping.js';\nconsole.log(new UserPiece() instanceof Piece);\n",
			'src/commands/ping.ts': "import { Piece } from 'piece-base';\nexport class UserPiece extends Piece {}\n"
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const outcome = await new TsdownBuilder(config).build();

		expect(outcome).toMatchObject({ ok: true, message: null });
		expect(await run(config.build.output)).toContain('true');
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
	test.skipIf(process.platform === 'win32')('recovers from a watch error with a fresh build start and duration', async () => {
		fixture = await createFixture({
			'package.json': PACKAGE_JSON,
			'stars.config.mjs': "export default { entry: 'src/main.ts', imports: false, future: { compatibilityVersion: 4 } };",
			'src/main.ts': 'const broken = ;'
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new TsdownBuilder(config);
		const starts = vi.fn();
		builder.on('start', starts);
		try {
			const failed = new Promise<BuildOutcome>((resolve) => builder.once('failure', resolve));
			await builder.watch();
			expect((await failed).ok).toBe(false);
			const fixed = new Promise<BuildOutcome>((resolve) => builder.once('success', resolve));
			await writeFile(join(fixture.root, 'src/main.ts'), "console.log('fixed');");
			const outcome = await fixed;
			expect(starts).toHaveBeenCalledTimes(2);
			expect(outcome.ok).toBe(true);
			expect(outcome.durationMs).toBeLessThan(5000);
		} finally {
			await builder.close();
		}
	});

	test.skipIf(process.platform === 'win32')('watch() rebuilds on change and reports through the same events', async () => {
		fixture = await createFixture({
			'package.json': PACKAGE_JSON,
			'stars.config.mjs': "export default { entry: 'src/main.ts', imports: false, future: { compatibilityVersion: 4 } };",
			'src/main.ts': "console.log('v1');\n"
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const before = vi.fn();
		const done = vi.fn();
		const success = vi.fn();
		const builder = new TsdownBuilder({
			...config,
			tsdown: { ...config.tsdown, hooks: { 'build:before': before, 'build:done': done }, onSuccess: success }
		});
		const successes: number[] = [];
		const progress: number[] = [];
		builder.on('progress', (fraction) => progress.push(fraction));
		builder.on('success', (outcome) => successes.push(outcome.durationMs));

		await new Promise<void>((resolve) => {
			builder.once('success', () => resolve());
			void builder.watch();
		});
		expect(successes).toHaveLength(1);
		expect(progress).toEqual([0.25, 0.5]);
		progress.length = 0;

		await writeFile(join(fixture.root, 'src', 'main.ts'), "console.log('v2');\n");
		await new Promise<void>((resolve) => builder.once('success', () => resolve()));
		expect(await run(config.build.output)).toContain('v2');
		expect(progress).toEqual([0.25, 0.5]);
		expect(before).toHaveBeenCalledTimes(1);
		expect(done).toHaveBeenCalledTimes(2);
		expect(success).toHaveBeenCalledTimes(2);

		await builder.close();
	});
});
