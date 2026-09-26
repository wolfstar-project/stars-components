import { fileURLToPath } from 'node:url';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		resolve: {
			alias: [
				{
					// The CI `unit` job runs tests without building first; alias to source like
					// packages/http-framework/vitest.config.ts does for its own workspace deps.
					find: '@wolfstar/http-framework',
					replacement: fileURLToPath(new URL('../http-framework/src/index.ts', import.meta.url))
				}
			]
		},
		test: {
			server: {
				deps: {
					// `src/register.ts` pulls `@wolfstar/plugin-i18next/register` in for its side effects. Vitest
					// externalizes it by default, which makes Node resolve its own `@wolfstar/http-framework`
					// import to the unbuilt `dist/`; inlining routes it through Vite so the alias above reaches
					// it as well.
					inline: ['@wolfstar/plugin-i18next']
				}
			}
		}
	})
);
