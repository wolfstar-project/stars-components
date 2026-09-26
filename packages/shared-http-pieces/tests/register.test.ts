import { Client, container } from '@wolfstar/http-framework';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, test } from 'vitest';

const consumerLocalesDirectory = fileURLToPath(new URL('./fixtures/locales', import.meta.url));

describe('register', () => {
	afterAll(() => {
		Client.plugins.registry.clear();
	});

	test('GIVEN the plugin register entrypoint imported first THEN the bundled locales are still loaded', async () => {
		// The Stars CLI prepends `import '@wolfstar/plugin-i18next/register'` to the entry when the plugin is a
		// runtime dependency, so the plugin's own `preGenericsInitialization` hook registers — and runs — before
		// the one this package registers, and its handler is built from the unmerged `i18n` option.
		await import('@wolfstar/plugin-i18next/register');
		await import('../src/register.js');

		const client = new Client({
			discordPublicKey: 'a'.repeat(64),
			discordToken: 'Bot.test.token',
			i18n: { defaultLanguageDirectory: consumerLocalesDirectory, defaultName: 'en-US' }
		});

		await client.load({ baseUserDirectory: null });

		// Both the bundled namespace and the consumer's own one resolve, meaning the handler that `init()` ran
		// on was rebuilt from the merged options rather than from the plugin's unmerged ones.
		expect(container.i18n.getT('en-US')('commands/consumer:greeting')).toBe('Hello');
		expect(container.i18n.getT('en-US')('commands/shared:infoFieldUptimeTitle')).toBe('Uptime');
	});
});
