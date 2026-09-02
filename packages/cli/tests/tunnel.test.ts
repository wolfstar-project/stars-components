import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { endpointUrl, readDiscordCredentials } from '../src/lib/tunnel.js';
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
