import { defineModule } from '@wolfstar/kit';

/**
 * The options of the module: none yet. The `httpPieces` key of `stars.config` is reserved for them.
 */
export type SharedHttpPiecesModuleOptions = Record<string, never>;

/**
 * Installs the shared commands, listeners and locales from `modules` in `stars.config`, instead of importing
 * `@wolfstar/shared-http-pieces/register` by hand:
 *
 * @example
 * ```ts
 * export default defineConfig({ modules: ['@wolfstar/shared-http-pieces'] });
 * ```
 *
 * @remarks
 * The module owns the `httpPieces` key of `stars.config`, which takes no options for now. Options given in the
 * `[specifier, options]` tuple of `modules` are merged over that key, so they win.
 */
export default defineModule<SharedHttpPiecesModuleOptions>({
	meta: { name: '@wolfstar/shared-http-pieces', configKey: 'httpPieces', compatibility: { framework: '>=6.5.0' } },
	setup(_options, ctx) {
		// `src/locales` is published next to `dist`, as `localesPath` in `./register.ts` expects.
		ctx.addLocales(new URL('../src/locales', import.meta.url));
		ctx.addPlugin({ from: new URL('./pieces.js', import.meta.url) });
	}
});

declare module '@wolfstar/schema' {
	interface StarsConfig {
		httpPieces?: SharedHttpPiecesModuleOptions;
	}
}
