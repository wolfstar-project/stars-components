---
'@wolfstar/env-utilities': minor
---

feat(env-utilities): add a `node` loader that parses `.env*` files with Node.js' own `util.parseEnv` (Node.js 20.12 or newer) and expands references like `dotenv-expand`, and make `dotenv` and `dotenv-expand` optional peer dependencies. When no loader is requested, `dotenv` is used if both packages are installed and the `node` loader if they are not, so a project that has them installed behaves as before and a varlock or new project installs nothing. Asking for `loader: 'dotenv'` without the packages throws an `Error` naming the missing one. `EnvLoaderOptions` no longer extends dotenv's `DotenvConfigOptions` (its `processEnv`, `quiet`, `override`, `fast` and `DOTENV_KEY` options were never forwarded), and `EnvSetupResult` is now the package's own `EnvLoaderOutput`.
