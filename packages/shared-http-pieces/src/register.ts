import { Client, container } from '@wolfstar/http-framework';
import { InternationalizationHandler } from '@wolfstar/plugin-i18next';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import './commands/_load.js';
import './listeners/_load.js';
import { registerSharedLocales } from './lib/register-i18n.js';

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
 *
 * That ordering only holds when this module is evaluated first. When the plugin's `register`
 * entrypoint is imported earlier (the Stars CLI prepends it to the entry of every project that
 * depends on the plugin), its hook runs first and has already built the handler from the
 * original options. The handler is then rebuilt from the merged ones: it only reads its options
 * in the constructor and is initialized later, in the plugin's `preLoad` hook, which reads
 * `container.i18n` at call time.
 */
Client.plugins.registerPreGenericsInitializationHook((options) => {
	const { i18n } = options;
	if (!i18n) return;
	options.i18n = registerSharedLocales(i18n, localesPath);
	if (container.i18n) container.i18n = new InternationalizationHandler(options.i18n);
}, '@wolfstar/shared-http-pieces');

// A dynamic import, not a static one: static imports are hoisted above the hook
// registration above, which would let the plugin's own hook register — and run — first.
await import('@wolfstar/plugin-i18next/register');
