import { defineModule } from '@wolfstar/kit';

/**
 * Installs the shared commands, listeners and locales from `modules` in `stars.config`, instead of importing
 * `@wolfstar/shared-http-pieces/register` by hand:
 *
 * @example
 * ```ts
 * export default defineConfig({ modules: ['@wolfstar/shared-http-pieces'] });
 * ```
 */
export default defineModule({
	meta: { name: '@wolfstar/shared-http-pieces', compatibility: { framework: '>=6.5.0' } },
	setup(_options, ctx) {
		// `src/locales` is published next to `dist`, as `localesPath` in `./register.ts` expects.
		ctx.addLocales(new URL('../src/locales', import.meta.url));
		ctx.addPlugin({ from: new URL('./pieces.js', import.meta.url) });
	}
});
