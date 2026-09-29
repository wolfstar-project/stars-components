import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
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
					replacement: fileURLToPath(new URL('../http-framework/src/index.ts', import.meta.url))
				},
				{
					find: '@wolfstar/discord-utilities',
					replacement: fileURLToPath(new URL('../discord-utilities/src/index.ts', import.meta.url))
				}
			]
		},
		test: {
			// Inlined so the alias above also applies to the plugin's own `@wolfstar/http-framework` import: externalized,
			// it would load the built framework, whose module init registers a second `interaction-handlers` store
			// over the one this package's sources use.
			server: { deps: { inline: ['@wolfstar/plugin-gateway'] } }
		}
	})
);
