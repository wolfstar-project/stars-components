import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default defineProject(
	mergeConfig(configShared, {
		esbuild: { target: 'es2021' },
		resolve: {
			alias: {
				'@wolfstar/http-framework': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
				'@wolfstar/http-framework-test-utils': fileURLToPath(new URL('../http-framework-test-utils/src/index.ts', import.meta.url)),
				'@wolfstar/http-framework-test-utils/vitest': fileURLToPath(new URL('../http-framework-test-utils/src/vitest.ts', import.meta.url))
			}
		}
	})
);
