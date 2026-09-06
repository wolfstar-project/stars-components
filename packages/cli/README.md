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

Watches the sources through the configured build tool (`tsdown` programmatically, configured from your `stars.config`, `tsc -b --watch`, or a plain file watcher for JavaScript projects), starts the bot after the first successful build and restarts it after every following one. Failed builds keep the previous process running and wait for the next change; a crashed bot waits for the next change or a manual restart.

The bot runs as a child `node` process with `STARS_DEV=1` in its environment. Because `stars dev` already restarts the whole process, leave the framework's own `hmr` option disabled while using it.

**Interactive UI** (default on a TTY): a bottom-aligned panel following the layout and keyboard conventions of
[Nuxt CLI's dev TUI](https://github.com/nuxt/cli/tree/b4b366eafdd9ac4d5b81b6ae7dadda35364252c9/packages/nuxt-cli/src/dev/tui).
The normal screen shows a Stars wordmark, aligned URLs, a 20-cell progress bar with elapsed time, status and
shortcuts. The percentage follows actual build milestones, not a timer: it can stay still while a compiler phase
runs. Once ready, the bar gives way to diagnostics and the header reports the load time.

Application output (including its banner), build-plugin output and diagnostics stay in the bounded log history and
`.stars/dev.log`. tsdown's entry list and output-size table are suppressed. Only log/help/info overlays enter the
alternate screen; closing them restores the panel without duplicating output in scrollback. Error stack frames do
not count as individual errors. `READY` reports process state unless `dev.health` is configured; it does not certify
that every application plugin loaded successfully. Logged errors switch the badge to `ERROR`.

| Key            | Action                                                       |
| -------------- | ------------------------------------------------------------ |
| `r` / `Ctrl+R` | restart the bot                                              |
| `o`            | open the local URL in a browser                              |
| `i`            | show project, versions, URLs, health, types and session info |
| `l`            | browse logs                                                  |
| `e`            | select the last error with its surrounding context           |
| `c` / `Ctrl+L` | clear log history                                            |
| `h` / `?`      | show keyboard shortcuts                                      |
| `q` / `Ctrl+D` | quit; confirm with `y` while a build/restart is in flight    |
| `Ctrl+C`       | quit immediately from any view                               |

In the log view: arrows or `j/k` select, `PgUp/PgDn` move a page, `g/G` go to the beginning/follow the tail,
`e/w/a` filter errors/warnings/all, `c/b/r` toggle CLI/build/runtime sources, `/` searches, `x` clears, and
`Enter`/`y` copies the selected line on terminals supporting OSC 52 clipboard writes. `q`, `Esc` or the view's
own shortcut closes an overlay rather than quitting the session. Nuxt-specific request and page-route inspectors
are not exposed: the bot supervisor does not receive those runtime events.

Replace the default wordmark in `stars.config.ts` (up to four lines are displayed, clipped to the terminal width):

```ts
export default defineConfig({
	dev: { banner: ['★ STARYL', 'Twitch notifications'] }
});
```

`dev.banner` also accepts a string containing newlines, or `false` to hide the wordmark. Omit it for Stars branding.
For the application's standalone banner outside the TUI, use `createStarsBanner` from `@wolfstar/start-banner`.

**Plain mode** prints prefixed lines instead and is selected by `--no-tui`, `STARS_TUI=plain`, redirected input/output,
CI, `TERM=dumb`, or terminals smaller than 40×10. `STARS_TUI=1` overrides CI/size checks, never redirected streams or
a dumb terminal. Both modes honour `NO_COLOR`/`FORCE_COLOR`; `STARS_REDUCED_MOTION=1` freezes the logo/spinner but
keeps the elapsed clock. Both stop the bot cleanly on `SIGINT`/`SIGTERM`. `SIGUSR2` restarts the bot (not on Windows).

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

### The build

`tsdown` is configured from `stars.config`, and a base project configures nothing: the entry's directory, one output
file per source file, ESM on Node, `build.outDir`, the tsconfig (`src/tsconfig.json` or `tsconfig.json`), the
extension `build.output` implies, sourcemaps, unbundled dependencies, Nuxt's `~`/`@`/`~~`/`@@` alias prefixes and
the auto imports plugin are all filled in
(the [framework README](../http-framework#the-build-tsdown) lists every default). The `tsdown` block is for what they
cannot know:

```typescript
export default defineConfig({
	entry: 'src/main.ts',
	future: { compatibilityVersion: 4 },
	tsdown: { plugins: [copyLocales()] }
});
```

With `future.compatibilityVersion: 3` an existing `tsdown.config.*` still drives the build and the block is merged
over it (values from `stars.config` win, `plugins` are appended); with `4` the block is the whole configuration. The
`vite` block works the same way for `build.tool: 'vite'`. `stars info` shows which file the build is configured from
and which options the block sets.

### Compatibility version

`future.compatibilityVersion` opts a project into the next major's defaults, the way Nuxt's own does (see the
[framework README](../http-framework#compatibility-version) for the full reference):

| Version       | What it changes                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `3` (default) | Today's behaviour: a `tsdown.config.*` drives the build, auto imports off unless asked for                          |
| `4`           | `tsdown` configured from `stars.config` alone, auto imports on and wired in, `'auto'` picks `tsdown` for TypeScript |

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
