import { defineConfig } from 'vitest/config';

const isCI = Boolean(process.env.CI);
const isWindows = process.platform === 'win32';

export default defineConfig({
	oxc: {
		target: 'es2021',
		decorator: {
			legacy: true,
			emitDecoratorMetadata: true
		}
	},
	test: {
		globals: true,
		maxWorkers: 1,
		isolate: false,
		// Process spawning and file locking are slower on Windows runners.
		testTimeout: isWindows ? 60_000 : 10_000,
		// Absorb the odd CI-only flake without hiding it locally.
		retry: isCI ? 2 : 0
	}
});
