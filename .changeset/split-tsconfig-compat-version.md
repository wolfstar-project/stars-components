---
'@wolfstar/schema': minor
---

Add `future.compatibilityVersion` `6`, now the latest and the default, gated by the new `SPLIT_TSCONFIG_VERSION` constant. From `6` a `tsdown` build's default `build.tsconfig` is the generated `.stars/tsconfig.app.json`, and `dev.typecheck.projects` lists the generated app and node configs for `stars typecheck` (`DEFAULT_APP_TSCONFIG`, `DEFAULT_NODE_TSCONFIG`). Projects that pin `5` or `4` keep today's single `.stars/tsconfig.json` and the `tsconfig.json` lookup unchanged.
