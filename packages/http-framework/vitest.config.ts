import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default defineProject(
	mergeConfig(configShared, {
		resolve: {
			alias: [
				{
					find: '@wolfstar/http-framework-test-utils/vitest',
					replacement: fileURLToPath(new URL('../http-framework-test-utils/src/vitest.ts', import.meta.url))
				},
				{
					find: '@wolfstar/http-framework-test-utils',
					replacement: fileURLToPath(new URL('../http-framework-test-utils/src/index.ts', import.meta.url))
				},
				{
					find: '@wolfstar/http-framework',
					replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url))
				}
			]
		}
	})
);
