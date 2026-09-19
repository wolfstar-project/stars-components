---
'@wolfstar/cli': minor
---

Implemented `experimental.enableNitro`: `stars dev`/`stars build` now build the bot through
[Nitro](https://nitro.build) v3's own Vite plugin (`nitro/vite`, requires Vite 8) instead of refusing with
`EXPERIMENT_UNAVAILABLE`.

Nitro v3 is itself a Vite plugin — there is no separate `nitro build` step — so the new `NitroBuilder` reuses the
project's own `vite.config.*`/`stars.config#vite` the same way `build.tool: 'vite'` does, and adds a generated
server entry on top: it wraps the entry's default export (the `Client` instance, already `load()`ed rather than
`listen()`ed) in `@wolfstar/http-framework/fetch`'s `createFetchHandler`, in the plain
`{ fetch(Request): Promise<Response> }` shape Nitro's own server entry convention expects. `stars build` now
produces `.output/` laid out for the configured `experimental.nitro.preset` (`node-server` by default, deployable
to anything Nitro targets — `cloudflare-module`, `aws-lambda`, `vercel`, `netlify`, `bun`, `deno-deploy`, and more)
instead of a `node:http` process; `stars dev` rebuilds and restarts on every change, the same as the other build
tools. Install `nitro` (and `vite`) as a dev dependency to use it.

The now-implemented `EXPERIMENT_UNAVAILABLE` diagnostic code is removed from `cliDiagnostics`/`CliDiagnosticCode`.
