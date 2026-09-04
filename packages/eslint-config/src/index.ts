import js from '@eslint/js';
import wolfstar, { recommendedRules } from '@wolfstar/eslint-plugin-http-framework';
import { defineConfig, type ConfigObject } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export interface CreateConfigOptions {
	/**
	 * The directory type-aware linting resolves `tsconfig.json` files from, usually `import.meta.dirname`.
	 */
	tsconfigRootDir: string;

	/**
	 * Glob patterns ESLint should never look at.
	 *
	 * @default ['**\/dist/**', '**\/node_modules/**', '**\/coverage/**']
	 */
	ignores?: string[];

	/**
	 * Whether to enable type-aware linting, which requires a `tsconfig.json` covering the linted files.
	 *
	 * @default true
	 */
	typeChecked?: boolean;
}

const defaultIgnores = ['**/dist/**', '**/node_modules/**', '**/coverage/**'];

/**
 * Creates the shared `@wolfstar` ESLint flat configuration.
 *
 * @param options - Options used to adapt the configuration to the consuming project.
 * @returns A flat config array ready to be exported from `eslint.config.ts`.
 *
 * @example
 * ```typescript
 * import { createConfig } from '@wolfstar/eslint-config';
 *
 * export default createConfig({ tsconfigRootDir: import.meta.dirname });
 * ```
 */
export function createConfig(options: CreateConfigOptions): ConfigObject[] {
	const { tsconfigRootDir, ignores = defaultIgnores, typeChecked = true } = options;

	return defineConfig(
		{ ignores },
		js.configs.recommended,
		typeChecked ? tseslint.configs.recommendedTypeChecked : tseslint.configs.recommended,
		{
			files: ['**/*.{ts,mts,cts,tsx}'],
			languageOptions: {
				parserOptions: {
					projectService: true,
					tsconfigRootDir
				}
			},
			rules: {
				'@typescript-eslint/no-floating-promises': 'error',
				'@typescript-eslint/no-misused-promises': 'error',
				'@typescript-eslint/await-thenable': 'error',
				'@typescript-eslint/return-await': ['error', 'in-try-catch'],
				'@typescript-eslint/require-await': 'error',
				'@typescript-eslint/restrict-template-expressions': 'off',
				'@typescript-eslint/no-duplicate-type-constituents': 'off',
				'@typescript-eslint/no-redundant-type-constituents': 'off',
				'@typescript-eslint/no-misused-spread': 'off'
			}
		},
		{
			plugins: { wolfstar },
			rules: recommendedRules
		},
		eslintConfigPrettier
	);
}
