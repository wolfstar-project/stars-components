import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import plugin from '../src/index.js';

const ruleTester = new RuleTester({
	languageOptions: {
		parser: tsParser,
		ecmaVersion: 2023,
		sourceType: 'module'
	}
});

function run(name: keyof typeof plugin.rules, tests: Parameters<RuleTester['run']>[2]) {
	ruleTester.run(name, plugin.rules[name]!, tests);
}

run('apply-options-decorator-order', {
	valid: [
		{
			code: `
				@ApplyOptions({ name: 'ping' })
				@RegisterCommand((builder) => builder)
				export class UserCommand {}
			`
		},
		{
			code: `
				@RegisterCommand((builder) => builder)
				export class UserCommand {}
			`
		}
	],
	invalid: [
		{
			code: `
				@RegisterCommand((builder) => builder)
				@ApplyOptions({ name: 'ping' })
				export class UserCommand {}
			`,
			errors: [{ messageId: 'wrongOrder' }]
		},
		{
			code: `
				@RestrictGuildIds(['1'])
				@ApplyOptions({ name: 'ping' })
				export class UserCommand {}
			`,
			errors: [{ messageId: 'wrongOrder' }]
		}
	]
});

run('require-subcommand-parent', {
	valid: [
		{
			code: `
				@RegisterCommand((builder) => builder)
				@RegisterSubcommand((builder) => builder)
				export class UserCommand {}
			`
		},
		{ code: 'export class UserCommand {}' }
	],
	invalid: [
		{
			code: `
				@RegisterSubcommand((builder) => builder)
				export class UserCommand {}
			`,
			errors: [{ messageId: 'missingParent' }]
		},
		{
			code: `
				@RegisterSubcommandGroup((builder) => builder)
				export class UserCommand {}
			`,
			errors: [{ messageId: 'missingParent' }]
		}
	]
});

run('no-raw-discord-fetch', {
	valid: [
		{ code: 'await container.rest.post(Routes.channelMessages(id), { body });' },
		{ code: "await fetch('https://example.com/api/v10/users/@me');" }
	],
	invalid: [
		{
			code: "await fetch('https://discord.com/api/v10/users/@me');",
			errors: [{ messageId: 'rawFetch' }, { messageId: 'rawUrl' }]
		},
		{
			code: "const base = 'https://canary.discord.com/api/v10';",
			errors: [{ messageId: 'rawUrl' }]
		}
	]
});

run('no-dynamic-translation-key', {
	valid: [
		{
			code: `
				import { applyLocalizedBuilder, getSupportedUserLanguageT } from '@wolfstar/plugin-i18next';
				const t = getSupportedUserLanguageT(interaction);
				t('commands/shared:info');
				applyLocalizedBuilder(builder, 'commands/shared:info');
			`
		},
		{
			code: `
				const t = getT();
				t(\`commands/shared:\${key}\`);
			`
		}
	],
	invalid: [
		{
			code: `
				import { getSupportedUserLanguageT } from '@wolfstar/plugin-i18next';
				const t = getSupportedUserLanguageT(interaction);
				t(\`commands/shared:\${key}\`);
			`,
			errors: [{ messageId: 'dynamicKey' }]
		},
		{
			code: `
				import { applyLocalizedBuilder } from '@wolfstar/plugin-i18next';
				applyLocalizedBuilder(builder, key);
			`,
			errors: [{ messageId: 'dynamicKey' }]
		}
	]
});

run('prefer-apply-localized-builder', {
	valid: [
		{
			code: `
				import { applyLocalizedBuilder } from '@wolfstar/plugin-i18next';
				@RegisterCommand((builder) => applyLocalizedBuilder(builder, 'commands/ping:name'))
				export class UserCommand {}
			`
		},
		{
			code: `
				@RegisterCommand((builder) => builder.setName('ping').setDescription('Pong'))
				export class UserCommand {}
			`
		}
	],
	invalid: [
		{
			code: `
				import { applyLocalizedBuilder } from '@wolfstar/plugin-i18next';
				@RegisterCommand((builder) => builder.setName('ping').setDescription('Pong'))
				export class UserCommand {}
			`,
			errors: [{ messageId: 'rawBuilder' }, { messageId: 'rawBuilder' }]
		}
	]
});

run('no-hoisted-plugin-register-import', {
	valid: [
		{
			code: `
				Client.plugins.registerPreGenericsInitializationHook((options) => options, 'test');
				await import('@wolfstar/plugin-i18next/register');
			`
		},
		{ code: "import '@wolfstar/plugin-i18next/register';" }
	],
	invalid: [
		{
			code: `
				import '@wolfstar/plugin-i18next/register';
				Client.plugins.registerPreGenericsInitializationHook((options) => options, 'test');
			`,
			errors: [{ messageId: 'hoistedRegister' }]
		}
	]
});

run('no-deprecated-i18n-package', {
	valid: [{ code: "import { applyLocalizedBuilder } from '@wolfstar/plugin-i18next';" }],
	invalid: [
		{
			code: "import { applyLocalizedBuilder } from '@wolfstar/http-framework-i18n';",
			errors: [{ messageId: 'deprecatedPackage' }]
		},
		{
			code: "await import('@wolfstar/http-framework-i18n/register');",
			errors: [{ messageId: 'deprecatedPackage' }]
		}
	]
});
