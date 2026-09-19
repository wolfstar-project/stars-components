import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { webcrypto } from 'node:crypto';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NitroBuilder } from '../src/builders/nitro.js';

async function generateDiscordKeyPair() {
	const { publicKey, privateKey } = (await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
	const raw = Buffer.from(await webcrypto.subtle.exportKey('raw', publicKey));
	return { publicKeyHex: raw.toString('hex'), privateKey };
}

async function sign(privateKey: CryptoKey, timestamp: string, body: string): Promise<string> {
	const data = Buffer.from(`${timestamp}${body}`);
	const signature = await webcrypto.subtle.sign('Ed25519', privateKey, data);
	return Buffer.from(signature).toString('hex');
}

/**
 * `nitro` and `vite` are resolved from the project root through the project's own `node_modules` (see
 * `importFromProject`), so the fixture needs one — a symlink to this package's real `node_modules` gets there
 * without a real install. It has to sit outside `packages/cli` entirely, though (here, next to `packages/`
 * itself): Vite's `resolve.tsconfigPaths` (see `NitroBuilder`'s `~`/`@`/`~~`/`@@` aliases) silently stops finding
 * the fixture's own `tsconfig.json` once the fixture is nested inside the very directory its `node_modules`
 * symlink points at (`packages/cli/.fixture/node_modules` → `packages/cli/node_modules`) — a self-referential
 * layout no real project has, so a sibling of `packages/cli` avoids it instead of chasing why.
 */
async function createNitroFixture(publicKeyHex: string): Promise<{ root: string; cleanup(): Promise<void> }> {
	const root = await mkdtemp(join(import.meta.dirname, '..', '..', '.nitro-fixture-'));
	await symlink(join(import.meta.dirname, '..', 'node_modules'), join(root, 'node_modules'), 'dir');
	await mkdir(join(root, 'src'), { recursive: true });
	await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'nitro-fixture', type: 'module' }));
	await writeFile(
		join(root, 'src', 'main.ts'),
		[
			"import { Client } from '@wolfstar/http-framework';",
			`const client = new Client({ clientId: '1', discordToken: 'x', discordPublicKey: ${JSON.stringify(publicKeyHex)} });`,
			'export default client;',
			''
		].join('\n')
	);
	await writeFile(root + '/stars.config.mjs', "export default { entry: 'src/main.ts', experimental: { enableVite: true, enableNitro: true } };\n");
	return { root, cleanup: () => rm(root, { recursive: true, force: true }) };
}

describe('NitroBuilder', () => {
	let fixture: { root: string; cleanup(): Promise<void> };

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('builds a Nitro server that dispatches interactions through client.fetch()', async () => {
		const { publicKeyHex, privateKey } = await generateDiscordKeyPair();
		fixture = await createNitroFixture(publicKeyHex);
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
		process.env.DISCORD_PUBLIC_KEY = publicKeyHex;
		process.env.PORT = '0';
		try {
			await import(pathToFileURL(config.build.output).href);
		} finally {
			delete process.env.DISCORD_PUBLIC_KEY;
			delete process.env.PORT;
		}

		const nitroApp = (globalThis as unknown as { __nitro__: Record<string, { fetch: (request: Request) => Promise<Response> }> }).__nitro__
			.default;

		const timestamp = String(Math.floor(Date.now() / 1000));
		const body = JSON.stringify({ type: 1 });
		const signature = await sign(privateKey, timestamp, body);

		const response = await nitroApp.fetch(
			new Request('http://localhost/', {
				method: 'POST',
				headers: { 'x-signature-ed25519': signature, 'x-signature-timestamp': timestamp, 'content-type': 'application/json' },
				body
			})
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ type: 1 });
	});

	test('resolves ~/@ aliases via Vite’s tsconfigPaths (see nitro.build/examples/import-alias)', async () => {
		const { publicKeyHex } = await generateDiscordKeyPair();
		fixture = await createNitroFixture(publicKeyHex);
		await mkdir(join(fixture.root, 'src', 'lib'), { recursive: true });
		await writeFile(join(fixture.root, 'src', 'lib', 'greeting.ts'), "export const greeting = 'hello from ~/lib';\n");
		// `prepare.test.ts` covers `.stars/tsconfig.json` generating these same `~`/`@`/`~~`/`@@` paths (a project's
		// own tsconfig extends it); written directly here to exercise `NitroBuilder`'s `resolve.tsconfigPaths: true`
		// against a plain path map, independent of that generation step.
		await writeFile(join(fixture.root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { paths: { '~/*': ['./src/*'] } } }));
		await writeFile(
			join(fixture.root, 'src', 'main.ts'),
			[
				"import { Client } from '@wolfstar/http-framework';",
				"import { greeting } from '~/lib/greeting.js';",
				`const client = new Client({ clientId: '1', discordToken: 'x', discordPublicKey: ${JSON.stringify(publicKeyHex)} });`,
				'console.log(greeting);',
				'export default client;',
				''
			].join('\n')
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
		const { publicKeyHex } = await generateDiscordKeyPair();
		fixture = await createNitroFixture(publicKeyHex);
		await writeFile(join(fixture.root, 'src', 'main.ts'), 'this is not valid typescript {{{\n');
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const builder = new NitroBuilder(config);

		const failed = new Promise<void>((resolve) => builder.once('failure', () => resolve()));
		const [outcome] = await Promise.all([builder.build(), failed]);
		expect(outcome.ok).toBe(false);
		expect(outcome.message).toBeTruthy();
	});
});
