import { definePlugin } from '@wolfstar/http-framework';
import './commands/_load.js';
import './listeners/_load.js';

// The plugin's own `register` entrypoint is imported here, in the bot, because the package that depends on it is
// the one that knows it needs it. Locales are not handled here: `ctx.addLocales` in `./module.ts` does that,
// before the plugin builds its handler.
await import('@wolfstar/plugin-i18next/register');

/**
 * The runtime half of {@link ./module.ts}. Importing this file registers the shared commands and listeners with the
 * stores, the way `./register.ts` does, so the plugin itself has no hooks: it only gives the registration a name.
 */
export default definePlugin({ name: '@wolfstar/shared-http-pieces' });
