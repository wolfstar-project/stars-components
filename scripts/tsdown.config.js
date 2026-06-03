// @ts-check
import { defineConfig } from 'tsdown';

/** @type {import('tsdown').UserConfig} */
const baseOptions = {
	clean: true,
	dts: true,
	entry: ['src/index.ts'],
	minify: false,
	deps: { skipNodeModulesBundle: true },
	sourcemap: true,
	target: 'es2021',
	treeshake: true
};

/**
 * @param {{ cjsOptions?: { disabled?: boolean; [key: string]: unknown }; esmOptions?: Record<string, unknown> }} [options]
 */
export function createTsdownConfig(options) {
	const { cjsOptions, esmOptions } = options ?? {};
	const { disabled: cjsDisabled, ...cjsRest } = cjsOptions ?? {};

	return defineConfig({
		...baseOptions,
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
