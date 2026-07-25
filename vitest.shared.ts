import { defineConfig } from 'vitest/config';

export default defineConfig({
	esbuild: {
		target: 'es2021',
		tsconfigRaw: {
			compilerOptions: {
				experimentalDecorators: true,
				emitDecoratorMetadata: true
			}
		}
	},
	test: {
		globals: true,
		maxWorkers: 1,
		isolate: false
	}
});
