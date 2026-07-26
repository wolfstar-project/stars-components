import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		test: {
			name: 'with-testing',
			include: ['tests/**/*.test.ts'],
			setupFiles: ['./vitest.setup.ts']
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
