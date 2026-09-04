<div align="center">

# @wolfstar/cli

**The `stars` command line interface for [`@wolfstar/http-framework`](../http-framework) projects.**

[![GitHub](https://img.shields.io/github/license/wolfstar-project/stars-components)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@wolfstar/cli?color=crimson&logo=npm&style=flat-square)](https://www.npmjs.com/package/@wolfstar/cli)

</div>

## Description

`stars` is a small, fast CLI that owns the developer workflow of a bot built with `@wolfstar/http-framework`. Like
Nuxt splits `nuxt.config`/`defineNuxtConfig` (owned by the `nuxt` framework) from `nuxi` (a separate CLI package that
calls into it), the typed `stars.config.*` schema and loader live in [`@wolfstar/http-framework`](../http-framework)
(`@wolfstar/http-framework/config`) — this package only consumes it to drive its commands:

- `stars dev` builds the project, starts the bot, restarts it on changes and shows what is happening in an interactive terminal UI (or plain logs).
- `stars build` runs the configured build tool once.
- `stars info` prints the resolved configuration and environment (`--json` for scripts).
- `stars codegen` runs the configured code generators (`--check` for CI).
- `stars prepare` generates the auto imports declaration file (`--check` for CI).
- `stars commands` inspects and cleans the application commands Discord has deployed.

Everything is driven by a typed `stars.config.ts` file.

## Installation

```sh
pnpm add -D @wolfstar/cli
```

Projects scaffolded with [`@wolfstar/create-http-framework`](../create-http-framework) come with `@wolfstar/cli`, a `stars.config.ts` file and `dev`/`build` scripts already wired up.

## Configuration

`stars.config.{ts,mts,cts,js,mjs,cjs}` is defined and loaded by [`@wolfstar/http-framework`](../http-framework#project-configuration-starsconfig), not by this package — see its README for the full option reference (`root`, `entry`, `build`, `dev`, `codegen`) and the `defineConfig` helper. `stars` looks for it in the working directory (`--config <file>` overrides it, `--cwd <dir>` changes the working directory) and passes `ConfigError`s from the framework through as exit code `2`, with the offending option path and a hint printed to the terminal.

```ts
// stars.config.ts
import { defineConfig } from '@wolfstar/http-framework/config';

export default defineConfig({
	entry: 'src/main.ts',
	build: { tool: 'tsdown' }
});
```

`stars dev`'s URL needs no configuration either — it is detected from `HTTP_PORT` (env var, `.env.local`/`.env`, or `dev.env`) or `3000`, the same way Vite's and Nuxt's dev servers do, and `localhost` is swapped for `127.0.0.1` at runtime if that is what is actually reachable. Set `dev.url` only to override it.

The resolved configuration is also available programmatically, exactly as the commands see it (re-exported from this package for convenience, or import it directly from `@wolfstar/http-framework/config`):

```ts
import { loadStarsConfig } from '@wolfstar/cli';

const config = await loadStarsConfig({ cwd: process.cwd() });
console.log(config.entry, config.build.output);
```

## Commands

```sh
stars dev [--no-tui] [--config <file>] [--cwd <dir>]
stars build [--config <file>] [--cwd <dir>]
stars info [--json] [--config <file>] [--cwd <dir>]
stars codegen [--check] [--json] [--config <file>] [--cwd <dir>]
stars prepare [--check] [--json] [--config <file>] [--cwd <dir>]
stars commands [list|clean] [--guild <id>] [--name <name>] [--yes] [--json]
stars --help | --version
```

### `stars dev`

Watches the sources through the configured build tool (`tsdown` programmatically with your `tsdown.config.*`, `tsc -b --watch`, or a plain file watcher for JavaScript projects), starts the bot after the first successful build and restarts it after every following one. Failed builds keep the previous process running and wait for the next change; a crashed bot waits for the next change or a manual restart.

The bot runs as a child `node` process with `STARS_DEV=1` in its environment. Because `stars dev` already restarts the whole process, leave the framework's own `hmr` option disabled while using it.

**Interactive UI** (default on a TTY): an [Ink](https://github.com/vadimdemedes/ink) (React) application in the
terminal's alternate screen — lifecycle and uptime, restart counter and reason, build state, URL, health, type
checking and tunnel status, plus the filtered logs.

| Key                    | Action                                                    |
| ---------------------- | --------------------------------------------------------- |
| `r`                    | restart the bot                                           |
| `c`                    | clear the logs                                            |
| `f`                    | cycle the source filter (all › app › build › stars)       |
| `e`                    | cycle the level filter (all › warnings › errors)          |
| `↑` `↓` / `j` `k`      | scroll one line (`PgUp`/`PgDn` one page, `End` to follow) |
| `h` / `?`              | toggle help                                               |
| `q` / `Esc` / `Ctrl+C` | quit                                                      |

**Plain mode** prints prefixed lines instead and is selected by `--no-tui`, `STARS_TUI=plain`, or automatically when stdout is not a terminal, in CI, or with `TERM=dumb`. Both modes honour `NO_COLOR`/`FORCE_COLOR`, `STARS_REDUCED_MOTION=1` disables the spinner, and both stop the bot cleanly on `SIGINT`/`SIGTERM`. `SIGUSR2` restarts the bot (not on Windows).

### `stars commands`

Lists what Discord currently has deployed, which is not necessarily what the project registers today: renamed and
removed commands stay until something deletes them.

```sh
stars commands list                 # global commands
stars commands list --guild 1234    # a guild's commands
stars commands clean                # wizard: pick from a checklist, then confirm
stars commands clean --name ping    # delete one, asking first
stars commands clean --guild 1234 --yes
```

It reads `DISCORD_TOKEN` and `DISCORD_APPLICATION_ID` (or `APPLICATION_ID`) from the environment or the project's
`.env`, the same place the bot reads them from. `clean` deletes deployed commands, so on a terminal it opens a wizard —
a checklist of what is deployed, then a confirmation — and refuses to run without `--yes` (or `--name`) anywhere
else.

### Type checking, tunnel and logs

Three `dev` options round out the dev loop (all documented in
[`@wolfstar/http-framework`](../http-framework#project-configuration-starsconfig)):

- `dev.typecheck: true` runs a type checker next to the bot and reports type errors on the UI's `tsc` channel,
  without ever blocking a build or a restart — useful when building with `tsdown`, which does not type-check.
  `dev.typecheck.checker` picks which one: `tsc` (the project's TypeScript, watch mode), `golar` (`golar tsc`, watch
  mode), `tsz` (the tsc-compatible checker, re-run after every build since it has no watch mode), or `auto` — the
  default, which uses `golar` when the project depends on it and `tsc` otherwise.
- `dev.tunnel: true` opens a `cloudflared` quick tunnel so Discord can reach the bot's interactions endpoint from the
  internet; a string is an https URL you already serve, which the CLI only probes. `dev.tunnel.updateEndpoint` writes
  the URL to the Discord application, and is opt-in because it edits a live application.
- `dev.logFile` (default `.stars/dev.log`) mirrors the session's logs to disk, so a run can be read back after the
  terminal UI is gone. Set it to `false` to disable it.

### Experimental flags

`experimental` in `stars.config.*` turns on work that is still landing (see the
[framework README](../http-framework#experimental-flags) for the full reference):

| Flag                 | What it changes                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `enableVite`         | Builds through the project's own `vite` (and allows `build.tool: 'vite'`) instead of `tsdown`          |
| `enableExternalVite` | The project runs Vite itself; `stars dev` only watches the build output and restarts the bot           |
| `enableNitro`        | Declared, not implemented: `stars dev`/`stars build` fail with `EXPERIMENT_UNAVAILABLE` until it lands |

`stars info` prints which flags are on.

### Exit codes

| Code  | Meaning                                              |
| ----- | ---------------------------------------------------- |
| `0`   | success                                              |
| `1`   | generic error (including `codegen --check` failures) |
| `2`   | invalid or missing configuration                     |
| `3`   | build failed                                         |
| `130` | interrupted with `SIGINT`                            |
| `143` | terminated with `SIGTERM`/`SIGHUP`                   |
