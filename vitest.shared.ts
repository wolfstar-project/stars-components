import { defineConfig } from 'vitest/config';

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
		isolate: false
	}
});
