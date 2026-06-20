import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		esbuild: { target: 'es2021' },
		resolve: {
			alias: {
				'@wolfstar/http-framework': fileURLToPath(new URL('./src/index.ts', import.meta.url))
			}
		}
	})
);
