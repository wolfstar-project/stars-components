import { definePlugin } from '@wolfstar/http-framework';
import './register.js';

/**
 * The runtime half of {@link ./module.ts}. Importing this file creates `container.influx` when the Influx
 * credentials are set, the way `./register.ts` does, so the plugin itself has no hooks: it only gives the
 * registration a name.
 */
export default definePlugin({ name: '@wolfstar/shared-influx-pieces' });
