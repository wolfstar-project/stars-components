import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/**/*.ts'],
	format: ['esm'],
	target: 'node20',
	// Mirror the src/ structure so the framework can load command pieces from dist/commands at runtime.
	unbundle: true,
	outExtensions: () => ({ js: '.js' }),
	clean: true,
	sourcemap: true
});
