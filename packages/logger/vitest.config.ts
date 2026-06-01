import { defineProject } from 'vitest/config';

export default defineProject({
	esbuild: { target: 'es2021' },
	test: {
		globals: true,
		maxWorkers: 1,
		isolate: false
	}
});
