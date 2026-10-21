import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		resolve: {
			alias: [
				{
					find: '@wolfstar/env-utilities',
					replacement: fileURLToPath(new URL('../env-utilities/src/index.ts', import.meta.url))
				}
			]
		}
	})
);
