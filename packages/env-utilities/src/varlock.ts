export type { EnvFromVarlock, EnvValueFromVarlock } from './lib/varlock-types';

/**
 * The `ENV` object of `varlock/env`: the values the schema resolved, already validated and coerced (a `port` is a
 * `number`, a `boolean` a `boolean`), typed by the file varlock generates with `@generateTsTypes`. `setup()` fills it
 * when it loads a schema with the `varlock` loader, so it can be adopted one call at a time next to `envParse*`.
 */
export { ENV as env } from 'varlock/env';
