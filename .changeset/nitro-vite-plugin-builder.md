---
'@wolfstar/http-framework': major
'@wolfstar/cli': minor
---

Implemented `experimental.enableNitro`: `stars dev`/`stars build` now build the bot through
[Nitro](https://nitro.build) v3's own Vite plugin (`nitro/vite`, requires Vite 8) instead of refusing with
`EXPERIMENT_UNAVAILABLE`.

- `@wolfstar/http-framework`: `Client` now has a `fetch(request, options?)` method — the Web `Request`/`Response`
  counterpart of `listen()`, running the exact same signature verification, routing and replies without binding a
  port, for anything that speaks Fetch instead of `node:http` (Nitro, a Worker, `Bun.serve`, `Deno.serve`, Vite's own
  dev middleware). The Discord public key is imported once and reused across calls, the same lifetime `listen()`
  gives its own signing key. The previously-unannounced `@wolfstar/http-framework/fetch` submodule
  (`createFetchHandler`/`FetchHandler`/`FetchHandlerOptions`) is removed in favour of this — a method on `Client`
  itself rather than a separate adapter module to import and wire up.
- `@wolfstar/cli`: Nitro v3 is itself a Vite plugin — there is no separate `nitro build` step — so the new
  `NitroBuilder` reuses the project's own `vite.config.*`/`stars.config#vite` the same way `build.tool: 'vite'` does,
  and adds a generated server entry on top: it imports the entry's default export (the `Client` instance, already
  `load()`ed rather than `listen()`ed) and calls `client.fetch(request)`, in the plain
  `{ fetch(Request): Promise<Response> }` shape Nitro's own server entry convention expects. `stars build` now
  produces `.output/` laid out for the configured `experimental.nitro.preset` (`node-server` by default, deployable
  to anything Nitro targets — `cloudflare-module`, `aws-lambda`, `vercel`, `netlify`, `bun`, `deno-deploy`, and more)
  instead of a `node:http` process; `stars dev` rebuilds and restarts on every change, the same as the other build
  tools. Install `nitro` (and `vite`) as a dev dependency to use it. The now-implemented `EXPERIMENT_UNAVAILABLE`
  diagnostic code is removed from `cliDiagnostics`/`CliDiagnosticCode`.
