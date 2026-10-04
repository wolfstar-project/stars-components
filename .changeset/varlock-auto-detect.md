---
'@wolfstar/env-utilities': minor
---

feat(env-utilities): pick the `varlock` loader automatically when `varlock` is installed and the project has a `src/.env.schema`, a `.env.schema` or a `varlock.loadPath` in `package.json`. An explicit `path`, the `loader` option and `DOTENV_LOADER` still win. **Behaviour change:** a project that already has a `.env.schema` and has `varlock` installed, but loaded its `.env*` files through dotenv, now loads through varlock after this release. Varlock reads the schema and its own `.env*` discovery, not `src/.env*` with `NODE_ENV` suffixes, so the values can differ: set `loader: 'dotenv'` (or `DOTENV_LOADER=dotenv`) to keep the previous behaviour. The loader is still experimental.
