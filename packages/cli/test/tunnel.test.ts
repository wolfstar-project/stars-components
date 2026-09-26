import { loadStarsConfig } from '@wolfstar/schema';
import { Tunnel, endpointUrl, readDiscordCredentials } from '../src/dev/tunnel.js';
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
});
