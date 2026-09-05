import type { Config } from 'prettier';

/**
 * The shared `@wolfstar` Prettier options, mirroring the oxfmt configuration used across Star Network projects.
 */
export const baseConfig = {
	useTabs: true,
	tabWidth: 4,
	printWidth: 150,
	singleQuote: true,
	quoteProps: 'as-needed',
	trailingComma: 'none',
	semi: true,
	endOfLine: 'lf'
} as const satisfies Config;

/**
 * Creates the shared `@wolfstar` Prettier configuration.
 *
 * @param overrides - Options merged on top of the shared ones, including `overrides` for per-glob rules.
 * @returns A Prettier config ready to be exported from `prettier.config.ts`.
 *
 * @example
 * ```typescript
 * import { createPrettierConfig } from '@wolfstar/prettier-config';
 *
 * export default createPrettierConfig({
 * 	overrides: [{ files: '*.md', options: { useTabs: false } }]
 * });
 * ```
 */
export function createPrettierConfig(overrides: Config = {}): Config {
	return { ...baseConfig, ...overrides };
}
