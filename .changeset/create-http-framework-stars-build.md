---
'@wolfstar/create-http-framework': minor
---

feat: scaffold the build inside `stars.config`

Generated TypeScript projects no longer ship a `tsdown.config.ts`: the build lives in `stars.config.ts` alongside
everything else the `stars` CLI reads, and `future: { compatibilityVersion: 4 }` opts them into the next major's
defaults — auto imports wired into the build, and `stars.config` as the only build configuration.

The generated `tsconfig.json` includes `.stars/*.d.ts` so the auto imports are typed and declares the `paths` for the
built-in `~`/`@`/`~~`/`@@` aliases, and the generated `.gitignore` covers `.stars/`.
