---
'@wolfstar/schema': minor
'@wolfstar/cli': patch
---

Make the CLI follow `@wolfstar/env-utilities` when it picks varlock by itself. With `future.compatibilityVersion` 6, a project that depends on `@wolfstar/env-utilities`, has a `.env.schema` (`src/.env.schema`, `.env.schema` or `varlock.loadPath`), has `varlock` installed and sets no `env.path` or `env.loader` now resolves `ResolvedEnvConfig.loader` to `'varlock'`, so `stars dev` and `stars doctor` read the variables through `varlock load` instead of the dotenv files the bot does not load, and `dev.url` no longer takes its port from them. `ResolvedEnvConfig.options` still holds what `stars.config` wrote. `detectVarlock(root)` is exported to inspect a project's schema, installation and dependency.
