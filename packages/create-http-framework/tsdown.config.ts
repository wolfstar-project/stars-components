import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: { esm: { outDir: 'dist', outExtensions: () => ({ js: '.js' }) } },
	banner: { js: '#!/usr/bin/env node' },
	dts: false,
	sourcemap: false,
	clean: true,
	minify: false,
	target: 'es2021',
	deps: { skipNodeModulesBundle: true },
	attw: { enabled: false },
	publint: { enabled: false }
});
