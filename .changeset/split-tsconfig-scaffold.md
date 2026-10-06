---
'@wolfstar/create-http-framework': minor
---

Scaffold the solution-style root `tsconfig.json` of compatibility version 6 for `tsdown`, `vite` and `vite-nitro` projects.

The generated `tsconfig.json` is `{ "files": [], "references": [...] }` pointing at the `.stars/tsconfig.app.json` and `.stars/tsconfig.node.json` that `stars prepare` writes, instead of extending `./.stars/tsconfig.json` and repeating `include`/`exclude`/`rootDir`/`outDir` per build tool, and the project gets a `typecheck` script running `stars typecheck`. The manifest records the `compatibilityVersion` the project was generated for. A rerun replaces the root `tsconfig.json` only when it is what the generator wrote before (this version's or the old `extends` one, compared as JSON so a formatter does not matter) and keeps, and warns about, a hand-edited one. The generated `AGENTS.md` and `README.md` document the script. The `tsc` branch is unchanged.
