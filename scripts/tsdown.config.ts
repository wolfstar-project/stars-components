import { defineConfig, type UserConfig } from 'tsdown';

type FormatConfig = Exclude<NonNullable<UserConfig['format']>, string | string[]> extends Record<string, infer V> ? NonNullable<V> : never;

interface FormatConfigCJS extends FormatConfig {
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
	treeshake: true
};

export function createTsdownConfig(options?: EnhancedTsdownOptions) {
	const { cjsOptions, esmOptions } = options ?? {};
	const { disabled: cjsDisabled, ...cjsRest } = cjsOptions ?? {};

	return defineConfig({
		...baseOptions,
		format: {
			esm: {
				outDir: 'dist/esm',
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

interface EnhancedTsdownOptions {
	cjsOptions?: FormatConfigCJS;
	esmOptions?: FormatConfig;
}
