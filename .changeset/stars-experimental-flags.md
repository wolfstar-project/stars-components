---
'@wolfstar/http-framework': minor
'@wolfstar/cli': minor
---

Add an `experimental` block to `stars.config.*`, in the shape Nuxt's own `experimental` config has: opt-in
booleans, all `false` by default, each documented with what it changes and what it still needs.

- `experimental.enableVite` lets a project build through its own `vite` instead of `tsdown` — `build.tool` accepts
  `'vite'` only with the flag on, and `'auto'` only then detects a `vite.config.*` (so a `vite.config.*` that
  belongs to something else in the repository never takes the bot's build over).
- `experimental.enableExternalVite` leaves the build to the project: `stars dev` starts no build of its own, it
  watches what the external one writes and restarts the bot, keeping restarts, health, the tunnel, type checking
  and the panel working.
- `experimental.enableNitro` is declared but not implemented yet: it needs the framework's Fetch adapter, so
  `stars dev`/`stars build` refuse it with an actionable error instead of silently ignoring it.

`stars info` reports which flags are on.
