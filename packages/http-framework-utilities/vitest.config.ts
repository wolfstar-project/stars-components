import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		resolve: {
			alias: {
				'@wolfstar/discord-utilities': fileURLToPath(new URL('../discord-utilities/src/index.ts', import.meta.url))
			}
		}
	})
);
