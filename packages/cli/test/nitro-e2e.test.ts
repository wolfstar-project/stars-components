import { spawn } from 'node:child_process';
import { generateKeyPairSync, sign } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { NitroBuilder } from '../src/builders/nitro.js';
import { runDev } from '../src/commands/dev.js';
import { ExitCode } from '../src/utils/errors.js';
import { loadProject } from '../src/utils/hooks.js';
import { waitFor } from './helpers.js';

/**
 * End-to-end checks of `experimental.enableNitro` with a real `@wolfstar/http-framework` `Client` (#386), where
 * `nitro-builder.test.ts` only builds a stub `{ fetch }` entry.
 *
 * The fixtures reuse `examples/with-nitro`: its command piece, and its `nitro`, `vite` and `discord-api-types`
 * installs. The framework is bundled from its sources through a Vite alias, because CI's unit job runs without
 * `pnpm build` (the same reason `vitest.config.ts` aliases the sibling packages). Vite options need `build.tool: 'vite'`.
 */
const PACKAGES = join(import.meta.dirname, '..', '..');
const EXAMPLE = join(PACKAGES, '..', 'examples', 'with-nitro');
const FIXTURES_DIR = join(import.meta.dirname, 'fixtures', 'nitro-e2e');

const SOURCES: Record<string, string> = {
	'@wolfstar/http-framework': join(PACKAGES, 'http-framework', 'src', 'index.ts'),
	'@wolfstar/discord-utilities': join(PACKAGES, 'discord-utilities', 'src', 'index.ts'),
	'@wolfstar/env-utilities': join(PACKAGES, 'env-utilities', 'src', 'index.ts')
};

/**
 * `package.json#sideEffects: false` covers the sources too, and `Client` relies on a side effect of a module it does
 * not import from (`container.applicationCommandRegistry` is set where the registry is defined), so tree shaking the
 * sources drops it. The published `dist` keeps it, being one module. This plugin keeps every source module whole.
 */
const SOURCES_SIDE_EFFECTS = `{ name: 'stars-e2e:sources-side-effects', transform(code, id) { return ${JSON.stringify(
	// Vite's module ids use forward slashes, also on Windows.
	Object.values(SOURCES).map((entry) => `${dirname(entry).replaceAll('\\', '/')}/`)
)}.some((directory) => id.replaceAll('\\\\', '/').startsWith(directory)) ? { code, map: null, moduleSideEffects: true } : null; } }`;

/**
 * The entry of `examples/with-nitro/src/main.ts`, without its command push: that call reaches Discord's API, which a
 * test must not do.
 */
const ENTRY = `import { Client, container } from '@wolfstar/http-framework';
import { PingCommand } from './commands/ping.js';

const client = new Client();
await container.stores.loadPiece({ name: 'ping', piece: PingCommand, store: 'commands' });
await client.load({ baseUserDirectory: null });

export default client;
`;

const EXAMPLE_REPLY = 'Pong! Served by Nitro.';

interface NitroFixture {
	root: string;
	write(path: string, content: string): Promise<void>;
	cleanup(): Promise<void>;
}

interface FixtureOptions {
	/** Top-level `stars.config` keys, as source, added next to `build`, `experimental` and `vite`. */
	config?: string;
	/** `experimental.nitro.preset`. */
	preset?: string;
	dependencies?: Record<string, string>;
	files?: Record<string, string>;
}

async function createFixture(options: FixtureOptions = {}): Promise<NitroFixture> {
	await mkdir(FIXTURES_DIR, { recursive: true });
	const root = await mkdtemp(join(FIXTURES_DIR, 'run-'));
	const fixture: NitroFixture = {
		root,
		async write(path, content) {
			await mkdir(dirname(join(root, path)), { recursive: true });
			await writeFile(join(root, path), content);
		},
		cleanup: () => rm(root, { recursive: true, force: true })
	};

	await mkdir(join(root, 'node_modules'));
	for (const name of ['nitro', 'vite', 'discord-api-types']) {
		await symlink(join(EXAMPLE, 'node_modules', name), join(root, 'node_modules', name), 'junction');
	}

	const alias = Object.entries(SOURCES)
		.map(([name, path]) => `{ find: new RegExp(${JSON.stringify(`^${name}$`)}), replacement: ${JSON.stringify(path)} }`)
		.join(', ');
	const preset = options.preset ?? 'node-server';
	await fixture.write('package.json', JSON.stringify({ name: 'nitro-e2e', type: 'module', dependencies: options.dependencies ?? {} }));
	await fixture.write(
		'stars.config.mjs',
		`export default { ${options.config ?? ''} build: { tool: 'vite' }, experimental: { enableVite: true, enableNitro: true, nitro: { preset: ${JSON.stringify(preset)} } }, vite: { resolve: { alias: [${alias}] }, plugins: [${SOURCES_SIDE_EFFECTS}] } };\n`
	);
	await mkdir(join(root, 'src', 'commands'), { recursive: true });
	await copyFile(join(EXAMPLE, 'src', 'commands', 'ping.ts'), join(root, 'src', 'commands', 'ping.ts'));
	await fixture.write('src/main.ts', ENTRY);
	for (const [path, content] of Object.entries(options.files ?? {})) await fixture.write(path, content);
	return fixture;
}

/**
 * Nitro's Vite plugin loads the project's `.env` files into `process.env` while it builds. The environment is put back
 * afterwards, so a fixture's variables never reach the tests that run later in this worker.
 */
async function build(config: Awaited<ReturnType<typeof loadProject>>['config']): Promise<void> {
	const environment = { ...process.env };
	const builder = new NitroBuilder(config);
	const logs: string[] = [];
	builder.on('log', (level, text) => logs.push(`${level}: ${text}`));
	try {
		const outcome = await builder.build();
		expect(outcome.ok, `${outcome.message}\n${logs.join('\n')}`).toBe(true);
	} finally {
		for (const name of Object.keys(process.env)) if (!(name in environment)) delete process.env[name];
		Object.assign(process.env, environment);
	}
}

const keys = generateKeyPairSync('ed25519');

/** What the `Client` reads at construction. The token is never sent anywhere: nothing here calls Discord's API. */
const DISCORD_ENV = {
	DISCORD_PUBLIC_KEY: Buffer.from(keys.publicKey.export({ format: 'jwk' }).x!, 'base64url').toString('hex'),
	DISCORD_TOKEN: 'MTIz.dGVzdA.dGVzdA',
	DISCORD_CLIENT_ID: '123'
};

/** A request signed the way Discord signs an interaction: Ed25519 over the timestamp and the body. */
function signed(body: unknown, { valid = true } = {}): Request {
	const text = JSON.stringify(body);
	const timestamp = String(Math.floor(Date.now() / 1000));
	const signature = valid ? sign(null, Buffer.from(`${timestamp}${text}`), keys.privateKey).toString('hex') : '00'.repeat(64);
	return new Request('http://localhost/', {
		method: 'POST',
		headers: { 'content-type': 'application/json', 'x-signature-ed25519': signature, 'x-signature-timestamp': timestamp },
		body: text
	});
}

const PING = { type: 1 };

/** A `/ping` chat input interaction in a DM, with the fields the router reads. */
const PING_COMMAND = {
	id: '1',
	application_id: '123',
	type: 2,
	token: 'interaction-token',
	version: 1,
	locale: 'en-US',
	entitlements: [],
	authorizing_integration_owners: {},
	app_permissions: '0',
	attachment_size_limit: 1,
	channel_id: '2',
	channel: { id: '2', type: 1 },
	context: 1,
	user: { id: '3', username: 'user', discriminator: '0', global_name: null, avatar: null },
	data: { id: '10', name: 'ping', type: 1 }
};

function commandReply(content: string) {
	return { type: 4, data: { content, flags: 64 } };
}

/** Sends `request` to `base` over HTTP, keeping its method, headers and body. */
function send(base: string, request: Request): Promise<Response> {
	return fetch(new URL(new URL(request.url).pathname, base), request);
}

/** `true` when `promise` fulfils, `false` when it rejects. */
function succeeds(promise: Promise<unknown>): Promise<boolean> {
	return promise.then(
		() => true,
		() => false
	);
}

interface RunningServer {
	url: string;
	stop(): Promise<void>;
}

/**
 * Starts `.output/server/index.mjs` the way a `node-server` deploy does. The server prints no "Listening on" line
 * when `TEST` is set (srvx), as it is under Vitest, so readiness is the first HTTP answer on the port.
 */
async function startServer(root: string, env: Record<string, string>): Promise<RunningServer> {
	const { DISCORD_PUBLIC_KEY: _key, DISCORD_TOKEN: _token, DISCORD_CLIENT_ID: _id, ...ambient } = process.env;
	const port = String(await freePort());
	const url = `http://127.0.0.1:${port}`;
	const child = spawn(process.execPath, [join(root, '.output', 'server', 'index.mjs')], {
		cwd: root,
		env: { ...ambient, PORT: port, NITRO_PORT: port, HOST: '127.0.0.1', NITRO_HOST: '127.0.0.1', HTTP_POST_PATH: '/', ...env },
		stdio: ['ignore', 'pipe', 'pipe']
	});

	let output = '';
	child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
	child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
	const exited = () => child.exitCode !== null || child.signalCode !== null;
	// A refused connection only means the server is still starting. A timeout is reported below, with the output.
	const ready = (await succeeds(waitFor(async () => exited() || (await succeeds(fetch(url))), 20_000))) && !exited();
	if (!ready) {
		child.kill();
		throw new Error(`The server did not answer on ${url} (exit code ${child.exitCode}):\n${output}`);
	}

	return {
		url,
		stop: () =>
			new Promise<void>((resolve) => {
				if (exited()) return resolve();
				child.once('exit', () => resolve());
				child.kill();
			})
	};
}

async function freePort(): Promise<number> {
	const server = createServer();
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const address = server.address();
	await new Promise<void>((resolve) => server.close(() => resolve()));
	if (!address || typeof address === 'string') throw new Error('Expected a TCP address');
	return address.port;
}

describe('Nitro build of a real Client', () => {
	let fixture: NitroFixture;
	let server: RunningServer;

	beforeAll(async () => {
		fixture = await createFixture();
		const { config } = await loadProject({ cwd: fixture.root, env: {} });
		await build(config);
		server = await startServer(fixture.root, DISCORD_ENV);
	}, 60_000);

	afterAll(async () => {
		await server?.stop();
		await fixture?.cleanup();
	});

	test('answers a signed PING over HTTP', async () => {
		const response = await send(server.url, signed(PING));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ type: 1 });
	});

	test('rejects an invalid signature with a 401', async () => {
		const response = await send(server.url, signed(PING, { valid: false }));

		expect(response.status).toBe(401);
	});

	test('runs the command piece loaded with loadPiece and returns its reply', async () => {
		const response = await send(server.url, signed(PING_COMMAND));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(commandReply(EXAMPLE_REPLY));
	});
});

describe('Nitro presets other than node-server', () => {
	let fixture: NitroFixture | undefined;

	afterEach(async () => {
		vi.unstubAllEnvs();
		await fixture?.cleanup();
		fixture = undefined;
	});

	// Both presets build a module whose default export answers Fetch requests. Node.js imports them directly here; the
	// Workers runtime itself (workerd) is not part of the test.
	test.each([
		{ preset: 'standard', extra: [] as string[] },
		{ preset: 'cloudflare-module', extra: ['wrangler.json'] }
	])(
		'builds the $preset preset, and its fetch handler answers a signed PING',
		async ({ preset, extra }) => {
			fixture = await createFixture({ preset });
			const { config } = await loadProject({ cwd: fixture.root, env: {} });
			await build(config);
			for (const file of extra) expect(existsSync(join(fixture.root, '.output', 'server', file)), file).toBe(true);

			for (const [name, value] of Object.entries({ ...DISCORD_ENV, HTTP_POST_PATH: '/' })) vi.stubEnv(name, value);
			const handler = (await import(pathToFileURL(config.build.output).href)) as {
				default: { fetch(request: Request, env?: unknown, context?: unknown): Promise<Response> };
			};
			const response = await handler.default.fetch(signed(PING), {}, { waitUntil() {}, passThroughOnException() {} });

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ type: 1 });
		},
		60_000
	);
});

describe('stars.config registrations in a Nitro build', () => {
	let fixture: NitroFixture | undefined;
	let server: RunningServer | undefined;

	afterEach(async () => {
		await server?.stop();
		await fixture?.cleanup();
		server = undefined;
		fixture = undefined;
	});

	test('runs env, then the modules plugins, then the plugin /register entries, before the entry', async () => {
		const record = (label: string) => `(globalThis.__starsProbe ??= []).push(${JSON.stringify(label)});`;
		fixture = await createFixture({
			config: "env: { loader: 'node' }, modules: ['probe-module'],",
			dependencies: { '@wolfstar/env-utilities': '*', '@wolfstar/plugin-probe': '*' },
			files: {
				'.env': `PROBE_FROM_DOTENV=loaded\n${Object.entries(DISCORD_ENV)
					.map(([name, value]) => `${name}=${value}`)
					.join('\n')}\n`,
				'node_modules/@wolfstar/plugin-probe/package.json': JSON.stringify({
					name: '@wolfstar/plugin-probe',
					type: 'module',
					exports: { './register': './register.js' }
				}),
				'node_modules/@wolfstar/plugin-probe/register.js': `${record('plugin /register')}\n`,
				'node_modules/probe-module/package.json': JSON.stringify({
					name: 'probe-module',
					type: 'module',
					exports: { '.': './index.js', './plugin': './plugin.js' }
				}),
				'node_modules/probe-module/index.js':
					"export default { meta: { name: 'probe-module' }, setup(_options, ctx) { ctx.addPlugin({ from: 'probe-module/plugin' }); } };\n",
				'node_modules/probe-module/plugin.js': `export default { name: 'probe', preGenericsInitialization() { ${record('module plugin')} } };\n`,
				'src/main.ts': [
					"import { Client } from '@wolfstar/http-framework';",
					'',
					'const seen = (globalThis.__starsProbe ??= []);',
					'seen.push(`entry, PROBE_FROM_DOTENV=${process.env.PROBE_FROM_DOTENV}`);',
					'const client = new Client();',
					'await client.load({ baseUserDirectory: null });',
					'',
					"export default { fetch: (request) => (new URL(request.url).pathname === '/probe' ? Response.json(seen) : client.fetch(request)) };",
					''
				].join('\n')
			}
		});
		const { config } = await loadProject({ cwd: fixture.root, env: {} });
		expect(config.env.enabled).toBe(true);
		expect(config.runtime.plugins).toEqual([expect.objectContaining({ module: 'probe-module', from: 'probe-module/plugin' })]);
		await build(config);

		// No Discord variables in the environment: the `Client` gets them from `.env`, through the `env` registration.
		server = await startServer(fixture.root, {});
		const probe = await fetch(new URL('/probe', server.url));

		expect(await probe.json()).toEqual(['plugin /register', 'entry, PROBE_FROM_DOTENV=loaded', 'module plugin']);
		expect((await send(server.url, signed(PING))).status).toBe(200);
	}, 60_000);
});

describe('stars dev with experimental.enableNitro', () => {
	let fixture: NitroFixture | undefined;

	afterEach(async () => {
		vi.restoreAllMocks();
		await fixture?.cleanup();
		fixture = undefined;
	});

	// Same libuv fs-event limitation as the other watch tests: see the comment in builders.test.ts.
	test.skipIf(process.platform === 'win32')(
		'serves the bot on --port and --host, and serves the new reply after a source change',
		async () => {
			const dev = { typecheck: false, env: { ...DISCORD_ENV, HTTP_POST_PATH: '/' } };
			fixture = await createFixture({ config: `dev: ${JSON.stringify(dev)},` });
			const port = await freePort();
			const url = `http://127.0.0.1:${port}`;
			const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
			const output: string[] = [];
			vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => output.push(String(chunk)) > 0);
			vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => output.push(String(chunk)) > 0);

			const replies = async () => {
				const response = await send(url, signed(PING_COMMAND)).catch(() => null);
				return response?.status === 200 ? ((await response.json()) as unknown) : null;
			};
			const expectReply = async (content: string) => {
				await waitFor(async () => JSON.stringify(await replies()) === JSON.stringify(commandReply(content)), 45_000).catch((error: Error) => {
					throw new Error(`${error.message}: no "${content}" reply on ${url}. Output:\n${output.join('').slice(-4000)}`);
				});
			};

			void runDev({ cwd: fixture.root, tui: false, port: String(port), host: '127.0.0.1', portConflict: 'error' }).catch((error: unknown) => {
				output.push(`runDev failed: ${String(error)}`);
			});
			try {
				await expectReply(EXAMPLE_REPLY);

				const ping = join(fixture.root, 'src', 'commands', 'ping.ts');
				await writeFile(ping, (await readFile(ping, 'utf8')).replace(EXAMPLE_REPLY, 'Pong! Rebuilt by stars dev.'));
				await expectReply('Pong! Rebuilt by stars dev.');
			} finally {
				process.emit('SIGTERM');
				await waitFor(() => exit.mock.calls.length > 0, 15_000);
			}

			expect(exit).toHaveBeenCalledWith(ExitCode.Terminated);
		},
		120_000
	);
});
