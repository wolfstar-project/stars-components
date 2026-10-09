---
'@wolfstar/cli': minor
---

Make varlock visible in `stars.config`. When a project has a `.env.schema` and `varlock` but `stars.config` does not set `env.loader`, `stars prepare`, `build`, `dev` and `info` now report it (`VARLOCK_LOADER_IMPLICIT`, or `VARLOCK_NOT_INSTALLED` when the schema has no varlock to load it), and `stars doctor` checks that the schema and `env.loader` agree (a schema with another loader, or `loader: 'varlock'` without the package). `stars doctor --fix` writes `env: { loader: 'varlock' }` for you: it creates `stars.config.ts` the way `@wolfstar/create-http-framework` scaffolds it, or edits a literal `defineConfig({ ... })` or exported object, and prints the line to add when the configuration is too dynamic to edit. It asks first (`--yes` answers), and never writes in CI or without a terminal to ask in.
