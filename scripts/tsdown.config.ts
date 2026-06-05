import { defineConfig, type UserConfig } from 'tsdown';
import { relative, resolve as resolveDir } from 'node:path';

export type FormatConfig = Exclude<NonNullable<UserConfig['format']>, string | string[]> extends Record<string, infer V> ? NonNullable<V> : never;

export interface FormatConfigCJS extends FormatConfig {
	disabled?: boolean;
}

const baseOptions: UserConfig = {
	clean: true,
	dts: true,
	entry: ['src/index.ts'],
	minify: false,
	deps: { skipNodeModulesBundle: true },
	sourcemap: true,
	target: 'es2021',
	treeshake: true,
	attw: {
		entrypoints: ['.'],
		enabled: true,
		level: 'error',
		profile: 'node16'
	},

	tsconfig: relative(__dirname, resolveDir(process.cwd(), 'tsconfig.build.json')),

	publint: {
		enabled: true,
		level: 'error'
	}
};

export function createTsdownConfig(options?: EnhancedTsdownOptions) {
	const { cjsOptions, esmOptions, entry } = options ?? {};
	const { disabled: cjsDisabled, ...cjsRest } = cjsOptions ?? {};

	return defineConfig({
		...baseOptions,
		...(cjsDisabled
			? {
					...esmOptions
				}
			: {}),
		entry: entry ?? baseOptions.entry,
		format: cjsDisabled
			? 'esm'
			: {
					esm: {
						outDir: 'dist/esm',
						...esmOptions
					},

					cjs: {
						outDir: 'dist/cjs',
						outExtensions: () => ({ js: '.cjs' }),
						...cjsRest
					}
				}
	});
}

export interface EnhancedTsdownOptions {
	cjsOptions?: FormatConfigCJS;
	esmOptions?: FormatConfig;
	entry?: UserConfig['entry'];
	target?: UserConfig['target'];
}
