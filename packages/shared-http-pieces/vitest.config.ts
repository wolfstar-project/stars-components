import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default defineProject(
	mergeConfig(configShared, {
		// `src/register.ts` uses top-level await, which the shared `es2021` target cannot express.
		oxc: { target: 'es2022' },
		resolve: {
			// Tests run before a build in CI, so workspace packages are resolved to their sources.
			alias: [
				{ find: '@wolfstar/schema', replacement: fileURLToPath(new URL('../schema/src/index.ts', import.meta.url)) },
				{ find: '@wolfstar/http-framework', replacement: fileURLToPath(new URL('../http-framework/src/index.ts', import.meta.url)) }
			]
		},
		test: {
			// Inlined so the alias above also applies to the plugin's own `@wolfstar/http-framework` import, sharing
			// one `Client`/`container` with this package's sources.
			server: { deps: { inline: ['@wolfstar/plugin-i18next'] } }
		}
	})
);
