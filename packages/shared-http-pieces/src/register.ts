import '@wolfstar/plugin-i18next/register';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import './commands/_load.js';
import './listeners/_load.js';

/**
 * Path pattern for this package's bundled locales, ready to be added to the
 * consuming app's `Client({ i18n: { backend: { paths: [...] } } })` config.
 * `@wolfstar/plugin-i18next` has no incremental directory registration, so
 * shared pieces packages must expose their own locales path for the app to
 * wire in at `Client` construction time.
 */
export const localesPath = join(fileURLToPath(new URL('../src/locales', import.meta.url)), '{{lng}}', '{{ns}}.json');
