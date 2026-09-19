/**
 * Public, side-effect free configuration surface of `@wolfstar/cli`.
 *
 * This module is intentionally tiny: importing it from a `stars.config.ts`
 * file must never start the bot nor pull the heavy runtime of the CLI.
 *
 * The actual schema and loader live in `@wolfstar/stars-config` (shared with `@wolfstar/cli`, so neither package
 * depends on the other); this re-exports its public surface unchanged so existing
 * `import { defineConfig } from '@wolfstar/http-framework/config'` code keeps working.
 *
 * @module @wolfstar/http-framework/config
 */
export * from '@wolfstar/stars-config';
