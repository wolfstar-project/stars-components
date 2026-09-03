import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ViteBuilder } from '../src/lib/builders/vite.js';

/**
 * `vite` is resolved from the project root through the project's own `node_modules` (see `importFromProject`), so
 * the fixture has to live where that resolution actually finds it — under this package's own `node_modules`, which
 * Node's lookup walks up to from any subdirectory, and which is already outside version control.
 */
async function createViteFixture(): Promise<{ root: string; cleanup(): Promise<void> }> {
	const root = await mkdtemp(join(import.meta.dirname, '..', 'node_modules', '.vite-fixture-'));
	await mkdir(join(root, 'src'), { recursive: true });
	await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'vite-fixture', type: 'module', main: 'dist/main.js' }));
	await writeFile(
		join(root, 'vite.config.ts'),
		"import { defineConfig } from 'vite';\nexport default defineConfig({ build: { ssr: true, outDir: 'dist', rollupOptions: { input: 'src/main.ts', output: { entryFileNames: 'main.js' } } } });\n"
	);
	await writeFile(
		root + '/stars.config.mjs',
		"export default { entry: 'src/main.ts', build: { tool: 'vite' }, experimental: { enableVite: true } };\n"
	);
	return { root, cleanup: () => rm(root, { recursive: true, force: true }) };
}

describe('ViteBuilder', () => {
	let fixture: { root: string; cleanup(): Promise<void> };

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('builds the project through the project’s own vite.config, producing a runnable entry', async () => {
		fixture = await createViteFixture();
		await writeFile(join(fixture.root, 'src', 'main.ts'), 'const port: number = 3000;\nconsole.log(`bot ready on ${port}`);\n');
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new ViteBuilder(config);

		const logs: string[] = [];
		builder.on('log', (level, text) => logs.push(`${level}: ${text}`));
		const started = new Promise<void>((resolve) => builder.once('start', resolve));

		const [outcome] = await Promise.all([builder.build(), started]);
		expect(outcome.ok).toBe(true);
		expect(outcome.message).toBeNull();

		const { stdout } = await import('node:child_process').then(
			(cp) =>
				new Promise<{ stdout: string }>((resolve, reject) => {
					cp.execFile(process.execPath, [join(fixture.root, 'dist', 'main.js')], (error, stdout) =>
						error ? reject(error) : resolve({ stdout })
					);
				})
		);
		expect(stdout).toContain('bot ready on 3000');
	});

	test('watch() rebuilds on change and reports through the same events, close() stops it', async () => {
		fixture = await createViteFixture();
		await writeFile(join(fixture.root, 'src', 'main.ts'), "console.log('v1');\n");
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new ViteBuilder(config);

		const successes: number[] = [];
		builder.on('success', (outcome) => successes.push(outcome.durationMs));

		await new Promise<void>((resolve) => {
			builder.once('success', () => resolve());
			void builder.watch();
		});
		expect(successes).toHaveLength(1);

		await writeFile(join(fixture.root, 'src', 'main.ts'), "console.log('v2');\n");
		await new Promise<void>((resolve) => builder.once('success', () => resolve()));
		expect(successes).toHaveLength(2);

		await builder.close();
	});

	test('reports a failed build instead of throwing', async () => {
		fixture = await createViteFixture();
		await writeFile(join(fixture.root, 'src', 'main.ts'), 'this is not valid typescript {{{\n');
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new ViteBuilder(config);

		const failed = new Promise<void>((resolve) => builder.once('failure', () => resolve()));
		const [outcome] = await Promise.all([builder.build(), failed]);
		expect(outcome.ok).toBe(false);
		expect(outcome.message).toBeTruthy();
	});
});
