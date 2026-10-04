---
'@wolfstar/env-utilities': minor
---

feat(env-utilities): pick the `varlock` loader automatically when `varlock` is installed and the project has a `src/.env.schema`, a `.env.schema` or a `varlock.loadPath` in `package.json`. An explicit `path`, the `loader` option and `DOTENV_LOADER` still win.
