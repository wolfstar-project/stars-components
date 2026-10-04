import { pathToFileURL } from 'node:url';
import { bridgeImportArgs, bridgeModuleSource, isAtLeast, parseBridgeMessage, type BridgeMessage } from '../src/dev/bridge.js';
import { changedFiles, isInside, snapshotFiles } from '../src/dev/changed-files.js';
import { ProcessSupervisor } from '../src/utils/process-supervisor.js';
import { loadStarsConfig } from '@wolfstar/schema';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createFixture, waitFor, type Fixture } from './helpers.js';

/** The part of `@wolfstar/http-framework` the bridge touches: `Client.use`, the client's events, its registry and stores. */
const FRAMEWORK = `
import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
export const container = { stores: new Map(), client: null };
export class Client extends EventEmitter {
	static plugins = [];
	static use(plugin) { Client.plugins.push(plugin); }
	constructor() {
		super();
		container.client = this;
		this.id = '123';
		this.pushed = 0;
		this.registry = {
			getLoadedGlobalCommands: () => [{ name: 'ping', description: 'Ping' }],
			getLoadedGuildCommands: () => new Map([['42', [{ name: 'admin' }]]]),
			pushGlobalCommands: async () => [{ id: '1' }],
			pushGuildRestrictedCommands: async () => (process.env.FAIL_PUSH ? [{ status: 'rejected', reason: new Error('Missing Access') }] : [{ status: 'fulfilled' }])
		};
		for (const plugin of Client.plugins) plugin.postInitialization?.(this);
	}
	async listen() {
		this.server = createServer((request, response) => { response.statusCode = 401; response.end('no'); });
		await new Promise((resolve) => this.server.listen(0, '127.0.0.1', resolve));
		for (const plugin of Client.plugins) await plugin.postListen?.(this);
	}
}
`;

const BOT = `
import { Client, container } from './framework.mjs';
const client = new Client();
container.stores.set('commands', { name: 'commands', values: () => [{ name: 'ping', location: { full: '/bot/commands/ping.js' } }] });
await client.listen();
const interaction = { type: 2, data: { type: 1, name: 'config', options: [{ type: 1, name: 'set', options: [] }] } };
const context = { command: { name: 'Config' }, interaction };
client.emit('commandRun', context);
client.emit('commandSuccess', context, null);
const failing = { handler: { name: 'vote' }, interaction: { type: 3, data: { custom_id: 'vote:1' } } };
client.emit('interactionHandlerRun', failing);
client.emit('interactionHandlerError', new Error('edit() was called when nothing has been sent yet.'), failing);
client.emit('hmrStart', ['/bot/commands']);
client.emit('hmrPieceReloaded', { name: 'ping', store: { name: 'commands' } }, '/bot/commands/ping.js');
client.emit('hmrError', new Error('Unexpected token'), '/bot/commands/broken.js');
await fetch('http://127.0.0.1:' + client.server.address().port + '/', { method: 'POST' });
setInterval(() => {}, 1000);
`;

describe('bridge', () => {
	let fixture: Fixture;
	let supervisor: ProcessSupervisor | undefined;

	afterEach(async () => {
		await supervisor?.stop();
		supervisor = undefined;
		await fixture?.cleanup();
	});

	async function startBot(env: NodeJS.ProcessEnv = {}) {
		fixture = await createFixture({ 'framework.mjs': FRAMEWORK, 'bot.mjs': BOT });
		const source = bridgeModuleSource(pathToFileURL(join(fixture.root, 'framework.mjs')).href);
		supervisor = new ProcessSupervisor({
			command: process.execPath,
			args: ['--import', `data:text/javascript,${encodeURIComponent(source)}`, join(fixture.root, 'bot.mjs')],
			cwd: fixture.root,
			env: { ...process.env, ...env },
			killTimeout: 2000,
			ipc: true
		});
		const messages: BridgeMessage[] = [];
		const stderr: string[] = [];
		supervisor.on('message', (message) => {
			const parsed = parseBridgeMessage(message);
			if (parsed) messages.push(parsed);
		});
		supervisor.on('stderr', (line) => stderr.push(line));
		supervisor.start();
		await waitFor(() => messages.some((message) => message.type === 'request') || stderr.length > 0);
		expect(stderr).toEqual([]);
		return messages;
	}

	test('reports what happens inside the bot over IPC', async () => {
		const messages = await startBot();
		const of = <Type extends BridgeMessage['type']>(type: Type) =>
			messages.filter((message): message is Extract<BridgeMessage, { type: Type }> => message.type === type);

		expect(of('ready')).toEqual([expect.objectContaining({ clientId: '123', port: expect.any(Number) })]);
		expect(of('pieces')).toEqual([expect.objectContaining({ store: 'commands', pieces: [{ name: 'ping', path: '/bot/commands/ping.js' }] })]);
		// Once when the bot is listening, once more after a command was hot reloaded.
		expect(of('commands')).toHaveLength(2);
		expect(of('commands')[0]).toMatchObject({ global: [{ name: 'ping', description: 'Ping' }], guilds: { '42': [{ name: 'admin' }] } });
		expect(of('dispatch')).toEqual([
			expect.objectContaining({ phase: 'run', route: 'slash:config set', piece: 'Config' }),
			expect.objectContaining({ phase: 'success', route: 'slash:config set', piece: 'Config', ms: expect.any(Number) }),
			expect.objectContaining({ phase: 'run', route: 'component:vote', piece: 'vote' }),
			expect.objectContaining({
				phase: 'error',
				route: 'component:vote',
				error: expect.objectContaining({ message: 'edit() was called when nothing has been sent yet.' })
			})
		]);
		expect(of('hmr')).toEqual([
			expect.objectContaining({ event: 'start', paths: ['/bot/commands'] }),
			expect.objectContaining({ event: 'reloaded', store: 'commands', names: ['ping'], path: '/bot/commands/ping.js' }),
			expect.objectContaining({ event: 'error', path: '/bot/commands/broken.js', message: 'Unexpected token' })
		]);
		expect(of('request')).toEqual([expect.objectContaining({ method: 'POST', path: '/', status: 401, ms: expect.any(Number) })]);
	});

	test('redeploys the commands when asked, and reports a failure instead of throwing in the bot', async () => {
		const messages = await startBot();
		expect(supervisor!.send({ source: 'stars:cli', type: 'commands:refresh' })).toBe(true);
		await waitFor(() => messages.some((message) => message.type === 'refreshed'));
		expect(messages.find((message) => message.type === 'refreshed')).toMatchObject({ ok: true, global: 1, guilds: 1 });
		await supervisor!.stop();

		const failing = await startBot({ FAIL_PUSH: '1' });
		// Something else on the channel is not the bridge's business.
		supervisor!.send({ type: 'commands:refresh' });
		supervisor!.send({ source: 'stars:cli', type: 'commands:refresh' });
		await waitFor(() => failing.some((message) => message.type === 'refreshed'));
		expect(failing.filter((message) => message.type === 'refreshed')).toEqual([
			expect.objectContaining({ ok: false, message: 'Missing Access' })
		]);
		expect(supervisor!.state).toBe('running');
	});

	test('stays out of the way without an IPC channel, and lets a finished bot exit', async () => {
		fixture = await createFixture({
			'framework.mjs': FRAMEWORK,
			'bot.mjs': "import { Client } from './framework.mjs'; new Client(); console.log('plugins=' + Client.plugins.length);"
		});
		const preload = `data:text/javascript,${encodeURIComponent(bridgeModuleSource(pathToFileURL(join(fixture.root, 'framework.mjs')).href))}`;
		for (const ipc of [false, true]) {
			const lines: string[] = [];
			supervisor = new ProcessSupervisor({
				command: process.execPath,
				args: ['--import', preload, join(fixture.root, 'bot.mjs')],
				cwd: fixture.root,
				env: process.env,
				killTimeout: 2000,
				ipc
			});
			supervisor.on('stdout', (line) => lines.push(line));
			supervisor.start();
			// The open channel must not keep a bot alive that has nothing left to do.
			await waitFor(() => supervisor!.state === 'stopped');
			expect(lines).toEqual([`plugins=${ipc ? 1 : 0}`]);
		}
	});

	test('parseBridgeMessage only accepts the bridge', () => {
		expect(parseBridgeMessage({ source: 'stars:bridge', type: 'ready', clientId: '1', port: 3000 })).toMatchObject({ type: 'ready' });
		expect(parseBridgeMessage({ type: 'ready' })).toBeNull();
		expect(parseBridgeMessage({ source: 'stars:bridge', type: 'nope' })).toBeNull();
		expect(parseBridgeMessage('ready')).toBeNull();
		expect(parseBridgeMessage(null)).toBeNull();
	});

	test('is only preloaded for a framework with object plugins', async () => {
		fixture = await createFixture({ 'src/main.js': '' });
		expect(bridgeImportArgs(await loadStarsConfig({ cwd: fixture.root, env: {} }))).toEqual([]);

		await fixture.write(
			'node_modules/@wolfstar/http-framework/package.json',
			JSON.stringify({ name: '@wolfstar/http-framework', version: '6.0.9', type: 'module', exports: './index.js' })
		);
		await fixture.write('node_modules/@wolfstar/http-framework/index.js', 'export {};');
		expect(bridgeImportArgs(await loadStarsConfig({ cwd: fixture.root, env: {} }))).toEqual([]);

		await fixture.write(
			'node_modules/@wolfstar/http-framework/package.json',
			JSON.stringify({ name: '@wolfstar/http-framework', version: '6.1.0', type: 'module', exports: './index.js' })
		);
		const args = bridgeImportArgs(await loadStarsConfig({ cwd: fixture.root, env: {} }));
		expect(args[0]).toBe('--import');
		expect(decodeURIComponent(args[1]!)).toContain(pathToFileURL(join(fixture.root, 'node_modules/@wolfstar/http-framework/index.js')).href);
	});

	test('isAtLeast compares release versions', () => {
		expect(isAtLeast('6.1.0', '6.1.0')).toBe(true);
		expect(isAtLeast('6.10.0', '6.2.0')).toBe(true);
		expect(isAtLeast('7.0.0-next.1', '6.1.0')).toBe(true);
		expect(isAtLeast('6.0.12', '6.1.0')).toBe(false);
		expect(isAtLeast('5.9.9', '6.1.0')).toBe(false);
	});
});

describe('changed files', () => {
	let fixture: Fixture;
	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('tells what changed between two builds by content, not by what was rewritten', async () => {
		fixture = await createFixture({
			'dist/main.js': 'main',
			'dist/commands/ping.js': 'ping',
			'dist/commands/old.js': 'old',
			'dist/locales/en-US/a.json': '{}',
			'dist/node_modules/pkg/index.js': '',
			'dist/tsconfig.tsbuildinfo': '1'
		});
		const roots = [join(fixture.root, 'dist'), join(fixture.root, 'missing')];
		const exclude = [join(fixture.root, 'dist/locales')];
		const before = snapshotFiles(roots, exclude);
		expect([...before.keys()].sort()).toEqual(
			['dist/commands/old.js', 'dist/commands/ping.js', 'dist/main.js'].map((file) => join(fixture.root, file))
		);

		// A bundler rewrites everything: only the files whose content differs count.
		await fixture.write('dist/main.js', 'main');
		await fixture.write('dist/commands/ping.js', 'ping, changed');
		await fixture.write('dist/commands/new.js', 'new');
		await fixture.write('dist/tsconfig.tsbuildinfo', '2');
		await fixture.write('dist/locales/en-US/a.json', '{ "changed": true }');
		await rm(join(fixture.root, 'dist/commands/old.js'));

		expect(changedFiles(before, snapshotFiles(roots, exclude)).sort()).toEqual(
			['dist/commands/new.js', 'dist/commands/old.js', 'dist/commands/ping.js'].map((file) => join(fixture.root, file))
		);
		expect(changedFiles(before, before)).toEqual([]);
	});

	test('isInside does not mistake a sibling for a child', () => {
		const commands = join('a', 'commands');
		expect(isInside(join(commands, 'ping.js'), commands)).toBe(true);
		expect(isInside(commands, commands)).toBe(true);
		expect(isInside(join('a', 'commands-old', 'ping.js'), commands)).toBe(false);
	});
});
