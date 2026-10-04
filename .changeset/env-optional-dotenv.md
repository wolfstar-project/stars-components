---
'@wolfstar/env-utilities': major
---

feat(env-utilities)!: make `dotenv` and `dotenv-expand` optional peer dependencies, loaded only when the `dotenv` loader runs, so a project using the `varlock` loader does not install them. **Breaking:** projects that use the `dotenv` loader (the default without a varlock schema) must now install `dotenv` and `dotenv-expand` themselves. The `EnvLoaderOptions` type no longer extends dotenv's `DotenvConfigOptions` (the options `processEnv`, `quiet`, `override`, `fast` and `DOTENV_KEY` were never forwarded), and `EnvSetupResult` is now the package's own `EnvLoaderOutput`.
