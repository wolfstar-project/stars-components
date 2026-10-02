import type { ModuleOptions, StarsModule } from './types.js';

/**
 * Defines an installable module. This is an identity helper that types the definition; the module is installed by
 * listing its package in `modules` in `stars.config`.
 *
 * @example
 * ```ts
 * import { defineModule } from '@wolfstar/kit';
 *
 * export default defineModule<{ ttl: number }>({
 * 	meta: { name: '@wolfstar/plugin-cache', compatibility: { framework: '>=6.1.0' } },
 * 	defaults: { ttl: 60_000 },
 * 	setup(options, ctx) {
 * 		ctx.addPlugin({ from: new URL('./plugin.js', import.meta.url), options });
 * 		ctx.addImports('@wolfstar/plugin-cache');
 * 	}
 * });
 * ```
 */
export function defineModule<Options extends ModuleOptions = ModuleOptions>(module: StarsModule<Options>): StarsModule<Options> {
	return module;
}
