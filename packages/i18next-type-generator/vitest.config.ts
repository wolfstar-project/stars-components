import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

// This package's source and build target es2022 and rely on top-level await
// (see tsdown.config.ts and src/cli.ts). Override the shared es2021 transform
// target so Vitest can transform the top-level await instead of erroring.
export default mergeConfig(
	configShared,
	defineProject({
		esbuild: {
			target: 'es2022'
		}
	})
);
