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
stars --help | --version
```

### `stars dev`

Watches the sources through the configured build tool (`tsdown` programmatically with your `tsdown.config.*`, `tsc -b --watch`, or a plain file watcher for JavaScript projects), starts the bot after the first successful build and restarts it after every following one. Failed builds keep the previous process running and wait for the next change; a crashed bot waits for the next change or a manual restart.

The bot runs as a child `node` process with `STARS_DEV=1` in its environment. Because `stars dev` already restarts the whole process, leave the framework's own `hmr` option disabled while using it.

**Interactive UI** (default on a TTY): lifecycle and uptime, restart counter and reason, build state, URL and health, filtered logs.

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

### Exit codes

| Code  | Meaning                                              |
| ----- | ---------------------------------------------------- |
| `0`   | success                                              |
| `1`   | generic error (including `codegen --check` failures) |
| `2`   | invalid or missing configuration                     |
| `3`   | build failed                                         |
| `130` | interrupted with `SIGINT`                            |
| `143` | terminated with `SIGTERM`/`SIGHUP`                   |
