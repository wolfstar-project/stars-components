import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import shared from '../../vitest.shared.js';
export default mergeConfig(
	shared,
	defineProject({
		resolve: {
			alias: [
				{ find: '@wolfstar/vite-server/internal', replacement: fileURLToPath(new URL('../vite-server/src/internal.ts', import.meta.url)) },
				{ find: '@wolfstar/vite-server', replacement: fileURLToPath(new URL('../vite-server/src/index.ts', import.meta.url)) },
				{ find: '@wolfstar/schema', replacement: fileURLToPath(new URL('../schema/src/index.ts', import.meta.url)) }
			]
		},
		test: { testTimeout: 30000 }
	})
);
