import { Client } from '@wolfstar/http-framework';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import './commands/_load.js';
import './listeners/_load.js';

/**
 * Path pattern for this package's bundled locales, in the format
 * `@wolfstar/plugin-i18next` expects for `i18n.backend.paths`.
 */
export const localesPath = join(fileURLToPath(new URL('../src/locales', import.meta.url)), '{{lng}}', '{{ns}}.json');

/**
 * `@wolfstar/plugin-i18next` reads `Client`'s `i18n` option exactly once, in its own
 * `preGenericsInitialization` hook, and has no API to register extra locale directories
 * afterwards. Hooks run in registration order, so registering this one *before* importing
 * the plugin's `register` entrypoint below guarantees it runs first and can splice this
 * package's locales into `options.i18n.backend.paths` before the plugin builds its
 * `InternationalizationHandler` — consumers that only import this module keep working
 * without having to list `localesPath` in their own `Client` config.
 */
Client.plugins.registerPreGenericsInitializationHook((options) => {
	const { i18n } = options;
	if (!i18n) return;
	options.i18n = { ...i18n, backend: { ...i18n.backend, paths: [...(i18n.backend?.paths ?? []), localesPath] } };
}, '@wolfstar/shared-http-pieces');

// A dynamic import, not a static one: static imports are hoisted above the hook
// registration above, which would let the plugin's own hook register — and run — first.
await import('@wolfstar/plugin-i18next/register');
