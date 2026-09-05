---
'@wolfstar/http-framework': minor
---

feat(config): add `future.compatibilityVersion`, with auto imports on from 4

`future` carries the defaults of the next major, the way Nuxt's own `future.compatibilityVersion` does: a project
opts into them one major early, and they become the default when that major ships. Where `experimental` guards work
that is still landing, everything in `future` is already decided.

`future: { compatibilityVersion: 4 }` changes three things:

- Auto imports are **on** with the `tsdown` build tool, and `stars` wires the `autoImports()` plugin into the build
  itself — until now the default said `true` but nothing injected the transform unless the project's own
  `tsdown.config.ts` did. At `3` they stay off unless asked for, so the promise matches what the build does.
- `tsdown` is configured from `stars.config` alone. A `tsdown.config.*` (or a `package.json#tsdown` field) raises
  `TSDOWN_CONFIG_FILE_UNSUPPORTED` naming the file, rather than being silently ignored and quietly dropping the
  plugins it declares.
- `build.tool: 'auto'` resolves to `tsdown` for any TypeScript entry, without looking for a `tsdown.config.*` or a
  `tsdown` dependency first. `tsc` stays available as an explicit choice.

`3` is the default and keeps today's behaviour, including loading a `tsdown.config.*` and merging the `tsdown` block
over it. An unknown version raises `INVALID_COMPATIBILITY_VERSION`.
