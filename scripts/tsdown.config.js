import { defineConfig } from 'tsdown';

const baseOptions = {
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

export function createTsdownConfig(options) {
	const { cjsOptions, esmOptions, entry, target } = options ?? {};
	const { disabled: cjsDisabled, ...cjsRest } = cjsOptions ?? {};

	return defineConfig({
		...baseOptions,
		entry: entry ?? baseOptions.entry,
		target: target ?? baseOptions.target,
		attw: {
			...baseOptions.attw,
			profile: cjsDisabled ? 'esm-only' : 'node16'
		},
		format: {
			esm: {
				outDir: 'dist/esm',
				outExtensions: () => ({ js: '.js' }),
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
