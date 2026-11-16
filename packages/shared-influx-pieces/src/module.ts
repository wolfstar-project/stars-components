import { defineModule } from '@wolfstar/kit';

/**
 * The options of the module: none yet. The `influxPieces` key of `stars.config` is reserved for them.
 */
export type SharedInfluxPiecesModuleOptions = Record<string, never>;

/**
 * Installs the Influx client and its listeners from `modules` in `stars.config`, instead of importing
 * `@wolfstar/shared-influx-pieces/register` by hand:
 *
 * @example
 * ```ts
 * export default defineConfig({ modules: ['@wolfstar/shared-influx-pieces'] });
 * ```
 *
 * @remarks
 * The module owns the `influxPieces` key of `stars.config`, which takes no options for now. Options given in the
 * `[specifier, options]` tuple of `modules` are merged over that key, so they win.
 */
export default defineModule<SharedInfluxPiecesModuleOptions>({
	meta: { name: '@wolfstar/shared-influx-pieces', configKey: 'influxPieces', compatibility: { framework: '>=6.1.0' } },
	setup(_options, ctx) {
		ctx.addPlugin({ from: new URL('./plugin.js', import.meta.url) });
	}
});

declare module '@wolfstar/schema' {
	interface StarsConfig {
		influxPieces?: SharedInfluxPiecesModuleOptions;
	}
}
