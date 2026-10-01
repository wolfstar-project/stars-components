import VersionInjector from '@redstardev/unplugin-version-injector/vite';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		plugins: [VersionInjector()],
		// `tests/*.test-d.ts` are type-level tests (see `schema-mirror.test-d.ts`): the root `tsconfig.json` leaves
		// `tests/` out of `pnpm typecheck`, so vitest checks them instead.
		test: { typecheck: { enabled: true, include: ['tests/**/*.test-d.ts'], tsconfig: './tests/tsconfig.typecheck.json' } }
	})
);
