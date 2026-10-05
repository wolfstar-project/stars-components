import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default defineProject(
	mergeConfig(configShared, {
		// `tests/**/*.test-d.ts` are type-level tests (see `Command.options.test-d.ts`): the root `tsconfig.json` leaves
		// `tests/` out of `pnpm typecheck`, so vitest checks them instead.
		test: { typecheck: { enabled: true, include: ['tests/**/*.test-d.ts'], tsconfig: './tests/tsconfig.typecheck.json' } },
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
					find: '@wolfstar/schema',
					replacement: fileURLToPath(new URL('../schema/src/index.ts', import.meta.url))
				},
				{
					find: '@wolfstar/http-framework',
					replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url))
				}
			]
		}
	})
);
