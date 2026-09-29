import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default defineProject(
	mergeConfig(configShared, {
		resolve: {
			alias: [
				{
					find: '@wolfstar/schema',
					replacement: fileURLToPath(new URL('../schema/src/index.ts', import.meta.url))
				},
				{
					find: '@wolfstar/http-framework',
					replacement: fileURLToPath(new URL('../http-framework/src/index.ts', import.meta.url))
				}
			]
		}
	})
);
