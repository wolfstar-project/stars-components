import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: ['./packages/**/vitest.config.ts'],
		coverage: {
			provider: 'v8',
			enabled: true,
			reporter: ['text', 'lcov', 'clover'],
			exclude: [...coverageConfigDefaults.exclude]
		}
	}
});
