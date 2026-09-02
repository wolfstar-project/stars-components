---
'@wolfstar/http-framework': minor
'@wolfstar/cli': minor
---

Round out the `stars dev` loop with the pieces a Discord bot needs while developing:

- `dev.typecheck` runs a type checker next to the bot and reports type errors on the dev UI's own `tsc` channel,
  without blocking builds or restarts — the type safety `tsdown` builds skip. `dev.typecheck.checker` selects
  `tsc`, `golar` (`golar tsc`) or `tsz`, and defaults to `auto`: `golar` when the project depends on it, `tsc`
  otherwise. `tsc` and `golar` watch the project themselves; `tsz`, which has no watch mode, is re-run after
  every build.
- `dev.tunnel` exposes the bot's interactions endpoint publicly, either through a `cloudflared` quick tunnel
  (`true`) or an https URL you already serve (a string), so Discord can reach it. `dev.tunnel.updateEndpoint`
  writes that URL to the Discord application's `interactions_endpoint_url` and is opt-in.
- `dev.logFile` (default `.stars/dev.log`) mirrors a dev session's logs to disk, so a run can be read back after
  the terminal UI is gone.
- `stars commands` lists and cleans the application commands Discord has deployed (`--guild`, `--name`, `--yes`,
  `--json`), which is how renamed or removed commands get cleared.
- `stars info` now reports the auto imports and the new `dev` options too.
- The interactive `stars dev` UI is now an [Ink](https://github.com/vadimdemedes/ink) (React) application: the
  same keys and layout, rebuilt as components, with the terminal's alternate screen handled by Ink itself.
  `@wolfstar/cli` therefore requires Node 22 or newer (Ink's own requirement); plain mode is unchanged and still
  takes over on non-interactive output, in CI and with `--no-tui`.
- `stars commands clean` without `--name`/`--yes` now runs an interactive wizard: a checklist of the deployed
  commands, then a confirmation, instead of an all-or-nothing prompt.
