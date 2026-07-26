import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/**/*.ts'],
	format: ['esm'],
	target: 'node20',
	unbundle: true,
	outExtensions: () => ({ js: '.js' }),
	clean: true,
	sourcemap: true
});
