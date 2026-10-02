import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import shared from '../../vitest.shared.js';

export default mergeConfig(
	shared,
	defineProject({
		resolve: {
			alias: [{ find: '@wolfstar/schema', replacement: fileURLToPath(new URL('../schema/src/index.ts', import.meta.url)) }]
		}
	})
);
