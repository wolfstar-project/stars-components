import { fileURLToPath } from 'node:url';

describe('register', () => {
	test('GIVEN plugin-i18next/register imported first THEN the bundled locales are still loaded', async () => {
		// The Stars CLI prepends the plugin's `register` entrypoint to the application entry, so its
		// `preGenericsInitialization` hook is registered — and runs — before this package's own.
		await import('@wolfstar/plugin-i18next/register');
		await import('../src/register.js');
		const { Client, container } = await import('@wolfstar/http-framework');

		new Client({
			discordPublicKey: '0'.repeat(64),
			discordToken: 'MA.test.token',
			clientId: '0',
			i18n: {
				defaultLanguageDirectory: fileURLToPath(new URL('./fixtures/locales', import.meta.url)),
				defaultName: 'en-US'
			}
		});
		await container.i18n.init();

		const t = container.i18n.getT('en-US');
		expect(t('commands/consumer:hello')).toBe('Hello');
		expect(t('commands/shared:infoFieldUptimeTitle')).toBe('Uptime');
	});
});
