import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default defineProject(
	mergeConfig(configShared, {
		resolve: {
			// Tests run before a build in CI, so workspace packages are resolved to their sources.
			alias: [
				{ find: '@wolfstar/schema', replacement: fileURLToPath(new URL('../schema/src/index.ts', import.meta.url)) },
				{ find: '@wolfstar/kit', replacement: fileURLToPath(new URL('../kit/src/index.ts', import.meta.url)) }
			]
		}
	})
);
