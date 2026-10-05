import { loadStarsConfig } from '@wolfstar/schema';
import { Tunnel, endpointUrl, readDiscordCredentials, type TunnelOptions } from '../src/dev/tunnel.js';
import { createFixture, type Fixture } from './helpers.js';

describe('endpointUrl', () => {
	test('appends the interactions path to the tunnel origin', () => {
		expect(endpointUrl('https://foo.trycloudflare.com', '/')).toBe('https://foo.trycloudflare.com');
		expect(endpointUrl('https://foo.trycloudflare.com', '/interactions')).toBe('https://foo.trycloudflare.com/interactions');
		expect(endpointUrl('https://foo.trycloudflare.com/', '/interactions')).toBe('https://foo.trycloudflare.com/interactions');
	});
});

describe('readDiscordCredentials', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('reads the token and application id from the project .env when the environment has none', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'DISCORD_TOKEN=from-file\nAPPLICATION_ID=123\n' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

		expect(readDiscordCredentials(config, {})).toEqual({ token: 'from-file', applicationId: '123' });
	});

	test('prefers the environment over the .env file and returns null without a token', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'DISCORD_TOKEN=from-file\n' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

		expect(readDiscordCredentials(config, { DISCORD_TOKEN: 'from-env', DISCORD_APPLICATION_ID: '9' })).toEqual({
			token: 'from-env',
			applicationId: '9'
		});

		await fixture.cleanup();
		fixture = await createFixture({ 'src/main.js': '' });
		const empty = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(readDiscordCredentials(empty, {})).toBeNull();
	});
});

describe('readDiscordCredentials with the varlock loader', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('reads the values varlock resolves, not a stale .env file', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'package.json': JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } }),
			'stars.config.mjs': "export default { env: { loader: 'varlock' } };",
			'.env': 'DISCORD_TOKEN=stale\n',
			// Stands in for `varlock load --format json`, which resolves the project's `.env.schema`.
			'node_modules/varlock/package.json': JSON.stringify({ name: 'varlock', bin: { varlock: './cli.js' } }),
			'node_modules/varlock/cli.js':
				"if (process.argv.slice(2).join(' ') === 'load --format json') console.log(JSON.stringify({ DISCORD_TOKEN: 'from-varlock', APPLICATION_ID: 42 }));\n"
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

		expect(readDiscordCredentials(config, {})).toEqual({ token: 'from-varlock', applicationId: '42' });
	});

	test('runs varlock the way the bot does, ignoring env.env', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'package.json': JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } }),
			// `@wolfstar/env-utilities` ignores `env` with varlock: `varlock/auto-load` gets no `--env`.
			'stars.config.mjs': "export default { env: { loader: 'varlock', env: 'production' } };",
			'node_modules/varlock/package.json': JSON.stringify({ name: 'varlock', bin: { varlock: './cli.js' } }),
			'node_modules/varlock/cli.js':
				"const token = process.argv.includes('--env') ? 'production-token' : 'bot-token';\nconsole.log(JSON.stringify({ DISCORD_TOKEN: token }));\n"
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

		expect(readDiscordCredentials(config, {})?.token).toBe('bot-token');
	});

	test('runs varlock in development mode, as the supervised bot does, whatever dev.env.NODE_ENV says', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'package.json': JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } }),
			// `createSupervisor` sets NODE_ENV to development after spreading `dev.env`, so the bot never sees production.
			'stars.config.mjs': "export default { env: { loader: 'varlock' }, dev: { env: { NODE_ENV: 'production' } } };",
			'node_modules/varlock/package.json': JSON.stringify({ name: 'varlock', bin: { varlock: './cli.js' } }),
			'node_modules/varlock/cli.js': 'console.log(JSON.stringify({ DISCORD_TOKEN: `${process.env.NODE_ENV}-token` }));\n'
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

		expect(readDiscordCredentials(config, {})?.token).toBe('development-token');
	});

	test('reads nothing from the env files when varlock cannot be run', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'package.json': JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } }),
			'stars.config.mjs': "export default { env: { loader: 'varlock' } };",
			'.env': 'DISCORD_TOKEN=stale\n',
			'node_modules/varlock/package.json': JSON.stringify({ name: 'varlock', bin: { varlock: './cli.js' } }),
			'node_modules/varlock/cli.js': 'process.exit(1);\n'
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });

		expect(readDiscordCredentials(config, {})).toBeNull();
	});
});

describe('Tunnel', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('opens a quick tunnel and reports its URL', async () => {
		const close = vi.fn().mockResolvedValue(undefined);
		const startTunnelMock = vi.fn().mockResolvedValue({ getURL: vi.fn().mockResolvedValue('https://foo.trycloudflare.com'), close });

		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': 'export default { dev: { tunnel: true } };' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const tunnel = new Tunnel(config, { startTunnel: startTunnelMock });

		await tunnel.start();

		expect(startTunnelMock).toHaveBeenCalledWith({ url: config.dev.url, acceptCloudflareNotice: true });
		expect(tunnel.state).toBe('up');
		expect(tunnel.url).toBe('https://foo.trycloudflare.com');

		await tunnel.close();
		expect(close).toHaveBeenCalledOnce();
		expect(tunnel.state).toBe('off');
	});

	test('fails when cloudflared setup is cancelled', async () => {
		const startTunnelMock = vi.fn().mockResolvedValue(undefined);

		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': 'export default { dev: { tunnel: true } };' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const tunnel = new Tunnel(config, { startTunnel: startTunnelMock });

		await tunnel.start();

		expect(tunnel.state).toBe('failed');
		expect(tunnel.url).toBeNull();
	});

	test('fails when startTunnel throws', async () => {
		const startTunnelMock = vi.fn().mockRejectedValue(new Error('cloudflared is not installed'));

		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': 'export default { dev: { tunnel: true } };' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const tunnel = new Tunnel(config, { startTunnel: startTunnelMock });
		const logs: Array<[string, string]> = [];
		tunnel.on('log', (level, text) => logs.push([level, text]));

		await tunnel.start();

		expect(tunnel.state).toBe('failed');
		expect(logs).toContainEqual(['error', 'cloudflared failed: cloudflared is not installed']);
	});

	test('closes a tunnel that finishes starting after close() was called', async () => {
		const close = vi.fn().mockResolvedValue(undefined);
		let resolveStartTunnel!: (tunnel: { getURL: () => Promise<string>; close: () => Promise<void> }) => void;
		const startTunnelMock = vi.fn(
			() => new Promise<{ getURL: () => Promise<string>; close: () => Promise<void> }>((resolve) => (resolveStartTunnel = resolve))
		);

		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': 'export default { dev: { tunnel: true } };' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const tunnel = new Tunnel(config, { startTunnel: startTunnelMock });

		const starting = tunnel.start();
		await tunnel.close();
		resolveStartTunnel({ getURL: vi.fn().mockResolvedValue('https://foo.trycloudflare.com'), close });
		await starting;

		expect(close).toHaveBeenCalledOnce();
		expect(tunnel.state).toBe('off');
		expect(tunnel.url).toBeNull();
	});

	describe('cloudflared exiting', () => {
		const exitError = () => new Error('cloudflared exited (code=0, signal=null) before URL was ready\n\nINF Tunnel server stopped');
		let unhandledRejectionListeners: Array<(...args: unknown[]) => void> = [];

		// Vitest reports every unhandled rejection as a failure, which would hide whether the tunnel's own guard handled it.
		beforeEach(() => {
			unhandledRejectionListeners = process.listeners('unhandledRejection') as Array<(...args: unknown[]) => void>;
			process.removeAllListeners('unhandledRejection');
		});

		afterEach(() => {
			process.removeAllListeners('unhandledRejection');
			for (const listener of unhandledRejectionListeners) process.on('unhandledRejection', listener);
		});

		const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

		async function createTunnel(startTunnel: TunnelOptions['startTunnel']) {
			fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': 'export default { dev: { tunnel: true } };' });
			const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
			const tunnel = new Tunnel(config, { startTunnel });
			const logs: Array<[string, string]> = [];
			tunnel.on('log', (level, text) => logs.push([level, text]));
			return { tunnel, logs };
		}

		test('does not crash when closing the tunnel rejects untun’s unsettled connection promise', async () => {
			const startTunnelMock = vi.fn().mockResolvedValue({
				getURL: vi.fn().mockResolvedValue('https://foo.trycloudflare.com'),
				// Like `untun`'s `exit` handler: a promise nobody awaits is rejected once cloudflared is gone.
				close: vi.fn(async () => void Promise.reject(exitError()))
			});
			const { tunnel, logs } = await createTunnel(startTunnelMock);
			const uncaught = vi.fn();
			process.once('uncaughtException', uncaught);

			await tunnel.start();
			await tunnel.close();
			await settle();
			process.off('uncaughtException', uncaught);

			expect(uncaught).not.toHaveBeenCalled();
			expect(tunnel.state).toBe('off');
			expect(logs.filter(([level]) => level === 'error')).toEqual([]);
			expect(process.listenerCount('unhandledRejection')).toBe(0);
		});

		test('stays silent when closing the tunnel while it is still starting', async () => {
			let rejectUrl!: (error: Error) => void;
			const getURL = vi.fn(() => new Promise<string>((_, reject) => (rejectUrl = reject)));
			const startTunnelMock = vi.fn().mockResolvedValue({
				getURL,
				close: vi.fn(async () => {
					Promise.reject(exitError()).catch(() => undefined);
					rejectUrl(exitError());
				})
			});
			const { tunnel, logs } = await createTunnel(startTunnelMock);

			const starting = tunnel.start();
			await vi.waitFor(() => expect(getURL).toHaveBeenCalled());
			await tunnel.close();
			await starting;
			await settle();

			expect(tunnel.state).toBe('off');
			expect(logs.filter(([level]) => level === 'error')).toEqual([]);
		});

		test('reports a tunnel that stops on its own as failed', async () => {
			const startTunnelMock = vi.fn().mockResolvedValue({
				getURL: vi.fn().mockResolvedValue('https://foo.trycloudflare.com'),
				close: vi.fn().mockResolvedValue(undefined)
			});
			const { tunnel, logs } = await createTunnel(startTunnelMock);
			await tunnel.start();

			void Promise.reject(exitError());
			await settle();

			expect(tunnel.state).toBe('failed');
			expect(tunnel.url).toBeNull();
			expect(logs).toContainEqual(['error', expect.stringContaining('cloudflared stopped unexpectedly')]);
			expect(process.listenerCount('unhandledRejection')).toBe(0);
		});

		test('throws unrelated unhandled rejections again instead of swallowing them', async () => {
			const startTunnelMock = vi.fn().mockResolvedValue({
				getURL: vi.fn().mockResolvedValue('https://foo.trycloudflare.com'),
				close: vi.fn().mockResolvedValue(undefined)
			});
			const { tunnel } = await createTunnel(startTunnelMock);
			const uncaught = vi.fn();
			process.once('uncaughtException', uncaught);
			await tunnel.start();

			void Promise.reject(new Error('something else'));
			await settle();
			process.off('uncaughtException', uncaught);
			await tunnel.close();

			expect(uncaught).toHaveBeenCalledWith(expect.objectContaining({ message: 'something else' }), expect.anything());
		});
	});

	test('removes the signal listeners untun adds so the CLI shuts the tunnel down itself', async () => {
		const before = process.listenerCount('SIGINT');
		const startTunnelMock = vi.fn(async () => {
			process.once('SIGINT', () => process.exit(130));
			process.once('SIGTERM', () => process.exit(143));
			process.once('SIGHUP', () => process.exit(129));
			return { getURL: vi.fn().mockResolvedValue('https://foo.trycloudflare.com'), close: vi.fn().mockResolvedValue(undefined) };
		});
		const own = vi.fn();
		process.on('SIGHUP', own);
		const hangups = process.listeners('SIGHUP');

		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': 'export default { dev: { tunnel: true } };' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const tunnel = new Tunnel(config, { startTunnel: startTunnelMock as never });

		await tunnel.start();

		expect(process.listenerCount('SIGINT')).toBe(before);
		expect(process.listeners('SIGHUP')).toEqual(hangups);
		await tunnel.close();
		process.off('SIGHUP', own);
	});
});
