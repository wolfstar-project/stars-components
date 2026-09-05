---
'@wolfstar/http-framework': minor
---

feat(config): configure the `tsdown` build from `stars.config`

The `tsdown` block is now the project's build configuration rather than a bag of options merged into a separate
`tsdown.config.ts`, and it is typed with the options a bot actually reaches for (`entry`, `format`, `unbundle`,
`plugins`, `alias`, `define`, `deps`, `hooks`, …) instead of `Record<string, unknown>`. What `stars.config` already
says — the entry's directory, `build.outDir`, `build.tsconfig`, the extension `build.output` implies — fills in the
rest, so most projects need nothing in it at all.

`build.tsconfig` is now resolved for `tsdown` builds too, not only `tsc` ones (`src/tsconfig.json`, else
`tsconfig.json`): `tsdown` alone looks only next to the project root, so a bot keeping its sources' tsconfig in
`src/` — the layout the scaffold and the examples use — silently built without its paths and target.

`build.configFile` on the resolved configuration reports which file the build tool is configured from
(`tsdown.config.*`, `package.json#tsdown`, `vite.config.*`), or `null` when `stars.config` is the only one.

Two options are also validated against the build tool they belong to: a non-empty `tsdown` block with another tool
raises `TSDOWN_OPTIONS_REQUIRE_TSDOWN`, and `vite` likewise raises `VITE_OPTIONS_REQUIRE_VITE`. A project that only
declares `tsdown: {}` now resolves `build.tool: 'auto'` to `tsdown`, the way depending on it already did.
