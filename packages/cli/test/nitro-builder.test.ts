import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NitroBuilder } from '../src/builders/nitro.js';

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures', 'nitro');

/**
 * A minimal stand-in for `Client#fetch` — `NitroBuilder`'s generated entry only ever calls `.fetch(request)` on
 * whatever the project's entry default-exports, so a plain object with that shape is enough to exercise the
 * wiring. This deliberately avoids depending on `@wolfstar/http-framework` being built: CI's unit test job runs
 * without a `pnpm build` first (see `ci.yml`), and `Client#fetch`'s own correctness is already covered directly
 * in `packages/http-framework/tests/fetch.test.ts`.
 */
const STUB_CLIENT = [
	'export default {',
	'\tasync fetch(request) {',
	'\t\tconst body = await request.text();',
	'\t\treturn new Response(JSON.stringify({ method: request.method, url: request.url, body }), {',
	'\t\t\tstatus: 200,',
	"\t\t\theaders: { 'content-type': 'application/json' }",
	'\t\t});',
	'\t}',
	'};',
	''
].join('\n');

/**
 * `nitro` and `vite` are resolved from the project root through the project's own `node_modules` (see
 * `importFromProject`), so the fixture needs one — a symlink to this package's real `node_modules` gets there
 * without a real install.
 */
async function createNitroFixture(): Promise<{ root: string; cleanup(): Promise<void> }> {
	await mkdir(FIXTURES_DIR, { recursive: true });
	const root = await mkdtemp(join(FIXTURES_DIR, 'run-'));
	await symlink(join(import.meta.dirname, '..', 'node_modules'), join(root, 'node_modules'), 'dir');
	await mkdir(join(root, 'src'), { recursive: true });
	await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'nitro-fixture', type: 'module' }));
	await writeFile(join(root, 'src', 'main.ts'), STUB_CLIENT);
	await writeFile(root + '/stars.config.mjs', "export default { entry: 'src/main.ts', experimental: { enableVite: true, enableNitro: true } };\n");
	return { root, cleanup: () => rm(root, { recursive: true, force: true }) };
}

describe('NitroBuilder', () => {
	let fixture: { root: string; cleanup(): Promise<void> };

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('builds a Nitro server that dispatches requests through the entry’s fetch()', async () => {
		fixture = await createNitroFixture();
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(config.build.output.endsWith(join('server', 'index.mjs'))).toBe(true);

		const builder = new NitroBuilder(config);
		const logs: string[] = [];
		builder.on('log', (level, text) => logs.push(`${level}: ${text}`));
		const started = new Promise<void>((resolve) => builder.once('start', resolve));

		const [outcome] = await Promise.all([builder.build(), started]);
		expect(outcome.ok, logs.join('\n')).toBe(true);
		expect(outcome.message).toBeNull();

		// The built preset (`node-server`) starts its own listener as a side effect of being imported — exactly what
		// deploying `.output/server/index.mjs` with plain `node` does — so importing it here, in-process, exercises
		// the exact same server a `node .output/server/index.mjs` deploy would run, without spawning a child process.
		process.env.PORT = '0';
		try {
			await import(pathToFileURL(config.build.output).href);
		} finally {
			delete process.env.PORT;
		}

		const nitroApp = (globalThis as unknown as { __nitro__: Record<string, { fetch: (request: Request) => Promise<Response> }> }).__nitro__
			.default;

		const response = await nitroApp.fetch(new Request('http://localhost/interactions', { method: 'POST', body: '{"type":1}' }));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ method: 'POST', url: 'http://localhost/interactions', body: '{"type":1}' });
	});

	test('resolves ~/@ aliases via Vite’s tsconfigPaths (see nitro.build/examples/import-alias)', async () => {
		fixture = await createNitroFixture();
		await mkdir(join(fixture.root, 'src', 'lib'), { recursive: true });
		await writeFile(join(fixture.root, 'src', 'lib', 'greeting.ts'), "export const greeting = 'hello from ~/lib';\n");
		// `prepare.test.ts` covers `.stars/tsconfig.json` generating these same `~`/`@`/`~~`/`@@` paths (a project's
		// own tsconfig extends it); written directly here to exercise `NitroBuilder`'s `resolve.tsconfigPaths: true`
		// against a plain path map, independent of that generation step.
		await writeFile(join(fixture.root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { paths: { '~/*': ['./src/*'] } } }));
		await writeFile(
			join(fixture.root, 'src', 'main.ts'),
			`import { greeting } from '~/lib/greeting.js';\nconsole.log(greeting);\n${STUB_CLIENT}`
		);

		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new NitroBuilder(config);
		const logs: string[] = [];
		builder.on('log', (level, text) => logs.push(`${level}: ${text}`));
		const outcome = await builder.build();

		expect(outcome.ok, `${outcome.message}\n${logs.join('\n')}`).toBe(true);
		expect(outcome.message).toBeNull();
	});

	test('reports a failed build instead of throwing', async () => {
		fixture = await createNitroFixture();
		await writeFile(join(fixture.root, 'src', 'main.ts'), 'this is not valid typescript {{{\n');
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new NitroBuilder(config);

		const failed = new Promise<void>((resolve) => builder.once('failure', () => resolve()));
		const [outcome] = await Promise.all([builder.build(), failed]);
		expect(outcome.ok).toBe(false);
		expect(outcome.message).toBeTruthy();
	});
});
