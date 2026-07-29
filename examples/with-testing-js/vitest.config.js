import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default defineProject(
	mergeConfig(configShared, {
		test: {
			name: 'with-testing-js',
			include: ['tests/**/*.test.js'],
			setupFiles: ['./vitest.setup.js']
		},
		resolve: {
			alias: [
				{
					find: '@wolfstar/http-framework-test-utils/vitest',
					replacement: fileURLToPath(new URL('../../packages/http-framework-test-utils/src/vitest.ts', import.meta.url))
				},
				{
					find: '@wolfstar/http-framework-test-utils',
					replacement: fileURLToPath(new URL('../../packages/http-framework-test-utils/src/index.ts', import.meta.url))
				},
				{
					find: '@wolfstar/http-framework',
					replacement: fileURLToPath(new URL('../../packages/http-framework/src/index.ts', import.meta.url))
				}
			]
		}
	})
);
