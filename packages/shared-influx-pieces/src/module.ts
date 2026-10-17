import { defineModule } from '@wolfstar/kit';

/**
 * Installs the Influx client and its listeners from `modules` in `stars.config`, instead of importing
 * `@wolfstar/shared-influx-pieces/register` by hand:
 *
 * @example
 * ```ts
 * export default defineConfig({ modules: ['@wolfstar/shared-influx-pieces'] });
 * ```
 */
export default defineModule({
	meta: { name: '@wolfstar/shared-influx-pieces', compatibility: { framework: '>=6.1.0' } },
	setup(_options, ctx) {
		ctx.addPlugin({ from: new URL('./plugin.js', import.meta.url) });
	}
});
