import { defineConfig } from 'oxfmt';

/**
 * The shared `@wolfstar` oxfmt configuration.
 *
 * It intentionally ships no `ignorePatterns`: those are project-specific and belong in the consumer's own config.
 *
 * @example
 * ```typescript
 * // oxfmt.config.ts
 * import { defineConfig } from 'oxfmt';
 * import baseConfig from '@wolfstar/oxfmt-config';
 *
 * export default defineConfig({
 * 	...baseConfig,
 * 	ignorePatterns: ['**\/dist/**']
 * });
 * ```
 */
const config = defineConfig({
	useTabs: true,
	tabWidth: 4,
	printWidth: 150,
	singleQuote: true,
	quoteProps: 'as-needed',
	trailingComma: 'none',
	semi: true,
	endOfLine: 'lf'
});

export default config;
