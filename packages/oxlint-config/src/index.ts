import { defineConfig } from 'oxlint';

/**
 * The shared `@wolfstar` oxlint configuration.
 *
 * It intentionally ships no `ignorePatterns`: those are project-specific and belong in the consumer's own config.
 *
 * @example
 * ```typescript
 * // oxlint.config.ts
 * import { defineConfig } from 'oxlint';
 * import baseConfig from '@wolfstar/oxlint-config';
 *
 * export default defineConfig({
 * 	extends: [baseConfig],
 * 	ignorePatterns: ['**\/dist/**', '**\/node_modules/**']
 * });
 * ```
 */
const config = defineConfig({
	jsPlugins: ['@wolfstar/eslint-plugin-http-framework'],
	rules: {
		'typescript/no-floating-promises': 'error',
		'typescript/no-misused-promises': 'error',
		'typescript/await-thenable': 'error',
		'typescript/return-await': ['error', 'in-try-catch'],
		'typescript/require-await': 'error',
		'typescript/restrict-template-expressions': 'off',
		'typescript/no-duplicate-type-constituents': 'off',
		'typescript/no-redundant-type-constituents': 'off',
		'typescript/no-misused-spread': 'off',
		'wolfstar/apply-options-decorator-order': 'error',
		'wolfstar/require-subcommand-parent': 'error',
		'wolfstar/no-raw-discord-fetch': 'error',
		'wolfstar/no-dynamic-translation-key': 'error',
		'wolfstar/prefer-apply-localized-builder': 'error',
		'wolfstar/no-hoisted-plugin-register-import': 'error',
		'wolfstar/no-deprecated-i18n-package': 'error'
	}
});

export default config;
