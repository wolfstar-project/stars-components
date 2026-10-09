---
'@wolfstar/create-http-framework': minor
---

Scaffold varlock projects. `--env varlock` (or the **Environment schema** feature in the prompt) adds a starter `.env.schema` with the bot's variables, the `varlock` dependency, and derives `Env` from the schema (`@generateTsTypes` plus `EnvFromVarlock`) instead of declaring it by hand. For `tsdown` and `vite` projects `stars.config.ts` also sets `env: { loader: 'varlock' }`. A target directory that already has a `.env.schema` or depends on `varlock` is detected without the flag: `varlock` stays a dependency and `stars.config.ts` sets the loader, and an existing `.env.schema` is never overwritten.
