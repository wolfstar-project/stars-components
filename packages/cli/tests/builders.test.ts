import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createBuilder } from '../src/lib/builders/index.js';
import { createFixture, waitFor, type Fixture } from './helpers.js';

describe('createBuilder', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('picks the builder from build.tool', async () => {
		fixture = await createFixture({ 'src/main.js': '' });
		expect((await createBuilder(await loadStarsConfig({ cwd: fixture.root, env: {} }))).tool).toBe('none');
		await fixture.cleanup();

		fixture = await createFixture({ 'src/main.ts': '', 'tsdown.config.ts': 'export default {};' });
		expect((await createBuilder(await loadStarsConfig({ cwd: fixture.root, env: {} }))).tool).toBe('tsdown');
	});

	test('picks tsdown for a TypeScript entry at compatibility version 4, with no tsdown.config.*', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'stars.config.mjs': 'export default { future: { compatibilityVersion: 4 } };'
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.configFile).toBeNull();
		expect((await createBuilder(config)).tool).toBe('tsdown');
	});

	test('uses vite when the experiment is on', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'vite.config.ts': 'export default {};',
			'stars.config.mjs': 'export default { experimental: { enableVite: true } };'
		});

		const builder = await createBuilder(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		expect(builder.tool).toBe('vite');
	});

	test('leaves the build alone when `enableExternalVite` is on', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'vite.config.ts': 'export default {};',
			'stars.config.mjs': 'export default { experimental: { enableVite: true, enableExternalVite: true } };'
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = await createBuilder(config);
		// The external builder reports the configured tool but never runs it: a build resolves instantly.
		expect(builder.tool).toBe('vite');
		expect(builder.constructor.name).toBe('ExternalBuilder');
		await expect(builder.build()).resolves.toMatchObject({ ok: true, durationMs: 0 });
	});

	// libuv's fs-event backend on Windows CI runners asserts and crashes the whole worker under rapid
	// watch/unwatch cycles in temp directories (a known native limitation, not something the test can work around).
	test.skipIf(process.platform === 'win32')('ExternalBuilder.watch() reports the initial build and rebuilds when the output changes', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'vite.config.ts': 'export default {};',
			'stars.config.mjs': 'export default { experimental: { enableVite: true, enableExternalVite: true } };'
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = await createBuilder(config);
		const successes: unknown[] = [];
		builder.on('success', (outcome) => successes.push(outcome));

		await mkdir(dirname(config.build.output), { recursive: true });
		await builder.watch();
		expect(successes).toHaveLength(1);

		await writeFile(config.build.output, 'console.log("built");');
		await waitFor(() => successes.length === 2);

		await builder.close();
	});

	test('refuses nitro until the framework can serve it', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsconfig.json': '{}',
			'stars.config.mjs': 'export default { experimental: { enableVite: true, enableNitro: true } };'
		});

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		await expect(createBuilder(config)).rejects.toMatchObject({ code: 'EXPERIMENT_UNAVAILABLE' });
	});
});
