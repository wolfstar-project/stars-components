import { defineConfig } from '@wolfstar/http-framework/config';

// A JavaScript entry needs no build step: `stars dev` runs `src/main.js` directly and restarts it on every change.
// With no build step there is no entry to register `env` in: src/lib/setup/all.js loads the environment itself.
export default defineConfig({ env: false });
