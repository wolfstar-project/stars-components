import type { StarsConfig } from './types/config.js';

export type * from './types/config.js';

/**
 * Typed helper for `stars.config.{ts,mts,cts,js,mjs,cjs}` files.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@wolfstar/http-framework/config';
 *
 * export default defineConfig({
 * 	entry: 'src/main.ts',
 * 	build: { tool: 'tsdown' }
 * });
 * ```
 */
export function defineConfig(config: StarsConfig): StarsConfig {
	return config;
}
