---
'@wolfstar/cli': minor
---

Generate a separate app and node tsconfig from `future.compatibilityVersion` `6`, like Nuxt 4, and add `stars typecheck`.

`stars prepare` (and `stars dev`/`stars build`) writes `.stars/tsconfig.app.json` (the bot sources, with the aliases, auto imports and the bundler options) and `.stars/tsconfig.node.json` (`stars.config.*`, `vitest.config.*`, `tsdown.config.*`, `vite.config.*` and `scripts/**`, with `NodeNext` resolution, `types: ["node"]` and no DOM library) instead of `.stars/tsconfig.json`. `--check` fails when either is outdated, and `stars doctor` and `stars info` report both. The project's own `tsconfig.json` becomes a solution-style file that references them; a root `tsconfig.json` that still extends `./.stars/tsconfig.json` gets a `TSCONFIG_LEGACY_EXTENDS` warning from `stars prepare` and `stars doctor`. Projects that pin `future.compatibilityVersion` to `5` or `4` keep the single `.stars/tsconfig.json`, unchanged.

`stars typecheck` regenerates `.stars/` and runs the project's checker (`golar` or `tsc`) once on each project, which a bare `tsc -p` on a `files: []` root cannot do.
