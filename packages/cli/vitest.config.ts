import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

// This package's source and build target es2022 and rely on top-level await
// (see tsdown.config.ts and src/cli.ts). Override the shared es2021 transform
// target so Vitest can transform the top-level await instead of erroring.
export default mergeConfig(
	configShared,
	defineProject({
		resolve: {
			alias: [
				{
					// The CI `unit` job runs tests without building first; alias to source like
					// packages/http-framework/vitest.config.ts does for its own workspace deps.
					find: '@wolfstar/http-framework/config',
					replacement: fileURLToPath(new URL('../http-framework/src/config.ts', import.meta.url))
				},
				{
					find: '@wolfstar/http-framework/auto-imports',
					replacement: fileURLToPath(new URL('../http-framework/src/auto-imports.ts', import.meta.url))
				}
			]
		},
		esbuild: {
			target: 'es2022'
		},
		test: {
			testTimeout: 30_000
		}
	})
);
