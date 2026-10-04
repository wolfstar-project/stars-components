// Lets Node.js run the TypeScript sources directly (with its built-in type stripping) by resolving the `.js` import
// specifiers used across the packages to their `.ts` counterparts.
import { register } from 'node:module';

register('./ts-resolver.mjs', import.meta.url);
