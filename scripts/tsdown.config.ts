import { defineConfig, type UserConfig } from 'tsdown';

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
		entry: entry ?? baseOptions.entry,
		format: {
			esm: {
				outDir: cjsDisabled ? 'dist' : 'dist/esm',
				...esmOptions
			},
			...(cjsDisabled
				? {}
				: {
						cjs: {
							outDir: 'dist/cjs',
							outExtensions: () => ({ js: '.cjs' }),
							...cjsRest
						}
					})
		}
	});
}

export interface EnhancedTsdownOptions {
	cjsOptions?: FormatConfigCJS;
	esmOptions?: FormatConfig;
	entry?: UserConfig['entry'];
}
