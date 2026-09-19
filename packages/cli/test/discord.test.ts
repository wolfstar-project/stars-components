import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { createDiscordClient } from '../src/utils/discord.js';
import { createFixture, type Fixture } from './helpers.js';

describe('createDiscordClient', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture({ 'src/main.js': '' });
	});

	afterEach(async () => {
		vi.unstubAllGlobals();
		await fixture.cleanup();
	});

	test('fails with an actionable error when the application id is missing', async () => {
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		expect(() => createDiscordClient(config, { DISCORD_TOKEN: 'token' })).toThrowError(/application id is not set/);
	});

	test('fails with an actionable error when Discord answers with an error', async () => {
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		const client = createDiscordClient(config, { DISCORD_TOKEN: 'token', DISCORD_APPLICATION_ID: '123' });

		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })));

		await expect(client.listCommands(null)).rejects.toMatchObject({ code: 'DISCORD_REQUEST_FAILED' });
	});
});
