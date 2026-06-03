import { defineConfig, type UserConfig } from 'tsdown';

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
	cjsOptions?: UserConfig & {
		disabled?: boolean;
	};
	esmOptions?: UserConfig;
}
