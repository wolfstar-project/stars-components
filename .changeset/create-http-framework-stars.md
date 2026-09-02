---
'@wolfstar/create-http-framework': minor
---

feat: scaffold projects on top of the `stars` CLI

Generated projects now depend on `@wolfstar/cli`, ship a `stars.config.ts` (or `stars.config.js`) file that imports
`defineConfig` from `@wolfstar/http-framework/config`, and use `stars dev` / `stars build` as their `dev` and `build`
scripts for every language and build tool, replacing the per-tool `watch`, `watch:start` and `tsc-watch` wiring. The
`generate:i18n` script now runs `stars codegen`.
