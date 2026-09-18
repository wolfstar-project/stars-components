---
'@wolfstar/oxfmt-config': minor
'@wolfstar/oxlint-config': minor
---

Ship the shared configs as built TypeScript modules created with `defineConfig` from `oxfmt`/`oxlint` instead of raw JSON files. `@wolfstar/oxfmt-config` now default-exports a config object to spread into `oxfmt.config.ts`, and `@wolfstar/oxlint-config` default-exports one to pass to `extends` in `oxlint.config.ts`. The `index.json` and `.oxlintrc.json` entry points are removed.
