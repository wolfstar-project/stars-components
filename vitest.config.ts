import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		projects: ['./packages/**/vitest.config.ts', './examples/**/vitest.config.ts', './examples/**/vitest.config.js'],
		// Inline PR annotations for failures on GitHub Actions (an explicit `--reporter` flag still overrides this).
		reporters: ['default', ...(process.env.GITHUB_ACTIONS ? (['github-actions'] as const) : [])],
		coverage: {
			provider: 'v8',
			enabled: true,
			reporter: ['text', 'lcov', 'clover'],
			exclude: [...coverageConfigDefaults.exclude, '**/test/**', '**/tests/**', 'benchmarks', 'examples', 'scripts']
		}
	}
});
