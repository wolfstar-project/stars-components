<div align="center">

# @wolfstar/cli

**The `stars` command line interface for [`@wolfstar/http-framework`](../http-framework) projects.**

[![GitHub](https://img.shields.io/github/license/wolfstar-project/stars-components)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@wolfstar/cli?color=crimson&logo=npm&style=flat-square)](https://www.npmjs.com/package/@wolfstar/cli)

</div>

## Description

`stars` is a small, fast CLI that owns the developer workflow of a bot built with `@wolfstar/http-framework`. Like
Nuxt splits `nuxt.config`/`defineNuxtConfig` (owned by `@nuxt/schema`, which both `nuxt` and the separate `@nuxt/cli`
package depend on) from `nuxi`, the typed `stars.config.*` schema and loader live in their own package,
[`@wolfstar/schema`](../schema), which both [`@wolfstar/http-framework`](../http-framework) (re-exported
as `@wolfstar/http-framework/config`) and this package depend on — this package only consumes it to drive its
commands. `@wolfstar/http-framework` also depends on this package and exposes it as its own `stars` binary (the way
`nuxt` exposes `nuxi`'s), so installing it is enough to get `stars` without a separate `@wolfstar/cli` install; this
package has no install-time dependency on `@wolfstar/http-framework` in return, the same way `@nuxt/cli` has none on
`nuxt` — its own commands:

- `stars dev` builds the project, starts the bot, restarts it (or leaves the change to the bot's hot reload) and shows what is happening in a full-screen dashboard: status, log channels and levels you can filter, and a prompt before changed commands are redeployed (or plain logs).
- `stars build` runs the configured build tool once.
- `stars info` prints the resolved configuration and environment (`--json` for scripts).
- `stars codegen` runs the configured code generators: i18next types and the typed options of your commands (`--check` for CI).
- `stars prepare` generates the TypeScript configuration in `.stars/` (`tsconfig.app.json` and `tsconfig.node.json`) and the auto imports declaration file (`--check` for CI).
- `stars typecheck` regenerates `.stars/` and type-checks every project once, the way `nuxt typecheck` does.
- `stars commands` inspects, compares, deploys and cleans the application commands Discord has deployed.
- `stars doctor` checks that the project is ready: runtime, framework, credentials, interactions endpoint, generated files.
- `stars completions` prints the shell completion script for bash, zsh or fish.

Everything is driven by a typed `stars.config.ts` file.

## Installation

```sh
pnpm add -D @wolfstar/cli
```

Installing [`@wolfstar/http-framework`](../http-framework) already gives a project the `stars` binary, so this
explicit install is only needed to depend on this package directly — for its programmatic exports (`loadStarsConfig`,
diagnostics), or to pin its version independently of the framework's.

Projects scaffolded with [`@wolfstar/create-http-framework`](../create-http-framework) come with `@wolfstar/cli`, a `stars.config.ts` file and `dev`/`build` scripts already wired up.

## Configuration

`stars.config.{ts,mts,cts,js,mjs,cjs}` is defined and loaded by [`@wolfstar/http-framework`](../http-framework#project-configuration-starsconfig), not by this package — see its README for the full option reference (`root`, `entry`, `build`, `dev`, `codegen`) and the `defineConfig` helper. `stars` looks for it in the working directory (`--config <file>` overrides it, `--cwd <dir>` changes the working directory) and passes `ConfigError`s from the framework through as exit code `2`, with the offending option path and a hint printed to the terminal.

```ts
// stars.config.ts
import { defineConfig } from '@wolfstar/http-framework/config';

export default defineConfig({});
```

`stars dev`'s URL needs no configuration either — it is detected from `HTTP_PORT` (env var, `src/.env*`/`.env*`, or `dev.env`) or `3000`, the same way Vite's and Nuxt's dev servers do, and `localhost` is swapped for `127.0.0.1` at runtime if that is what is actually reachable. Set `dev.url` only to override it.

The resolved configuration is also available programmatically, exactly as the commands see it (re-exported from this package for convenience, or import it directly from `@wolfstar/http-framework/config`):

```ts
import { loadStarsConfig } from '@wolfstar/cli';

const config = await loadStarsConfig({ cwd: process.cwd() });
console.log(config.entry, config.build.output);
```

`loadStarsConfig` only validates what the schema owns. A top-level key that is not built in is kept as `config.moduleOptions` (it may be the options of a module, `meta.configKey`), not rejected, so a misspelled key is reported by the `stars` commands once the modules are set up, not by `loadStarsConfig`. A tool that loads the configuration on its own and wants that check calls `assertModuleOptionsClaimed(config, claimedKeys)` from `@wolfstar/schema` (also exported by `@wolfstar/http-framework/config`) with the `meta.configKey`s of the modules it installed, or `[]` when it installs none.

## Commands

```sh
stars dev [--no-tui] [--tunnel|--no-tunnel] [--no-mouse] [--layout <auto|dashboard|panel>] [--channel <name>] [--level <level>] [--theme <name>] [--config <file>] [--cwd <dir>]
stars build [--config <file>] [--cwd <dir>]
stars info [--json] [--config <file>] [--cwd <dir>]
stars codegen [--check] [--json] [--config <file>] [--cwd <dir>]
stars prepare [--check] [--json] [--config <file>] [--cwd <dir>]
stars typecheck [--config <file>] [--cwd <dir>]
stars commands [list|clean|diff|deploy] [--guild <id>] [--name <name>] [--check] [--yes] [--json]
stars doctor [--online] [--fix] [--yes] [--json] [--config <file>] [--cwd <dir>]
stars completions <bash|zsh|fish>
stars --help | --version
```

### `stars dev`

Watches the sources through the configured build tool (`tsdown` programmatically, configured from your `stars.config`, `tsc -b --watch`, or a plain file watcher for JavaScript projects), starts the bot after the first successful build and restarts it after every following one. Failed builds keep the previous process running and wait for the next change; a crashed bot waits for the next change or a manual restart.

The bot runs as a child `node` process with `STARS_DEV=1` and `NODE_ENV=development` in its environment.

**Dashboard** (default on a TTY of at least 90×20): a full-screen view in the alternate buffer.

```text
 my-bot • stars v2.3.0            │ I   22:07:01        cli ● Build succeeded in 164ms
                                  │ I   22:07:01        cli ● Starting (first build)
 ● running                        │─────────────────────────────────────────────────────────
 my-bot is ready!                 │ D   22:07:01   commands ● Loaded commands: 1 global, 0 guild groups
 http    v6.1.0                   │                         │ ping
 up      3m 35s                   │─────────────────────────────────────────────────────────
 port    6967                     │ I   22:07:02  lifecycle ● Listening on port 6967
 tunnel  live                     │ W   22:07:11       http ● POST / 401 in 1ms
 logs    .stars/dev.log           │ D   22:07:31 interactions ● Processing slash:ping with ping
                                  │ T   22:09:16        hmr ● UPDATE src/commands/ping.js
 ▾ channels                       │ D   22:09:16        hmr ● Reloaded ping from src/commands/ping.js
   bot cli commands hmr http      │┌────────────────────────────────────────────────────────┐
 ▾ levels                         ││ Commands updated:                                      │
   error warn info debug trace    ││ - ping changed                                         │
                                  ││ Refresh commands? (y/n)                                │
                           ● live │└────────────────────────────────────────────────────────┘
```

The sidebar shows the state of the session (`starting`, `building`, `running`, `stopped`, `error`), the framework
version, the uptime, the port, the tunnel and where the logs are written, then the two filters of the stream. The
stream prints one line per entry: a level badge (`T D I W E`), the time, the channel, and the message with URLs,
paths, names and numbers picked out. An entry with detail lines (the commands that were loaded, the paths that are
watched) is a block between two rules; the stack frames the bot prints after an error are folded under that error
and count as one. The percentage of a build follows actual build milestones, not a timer.

**Channels** say what an entry is about, so each can be switched off:

| Channel        | What logs there                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| `cli`          | `stars dev` itself: builds, restarts, hooks, warnings                           |
| `build`        | the build tool and the file watcher                                             |
| `bot`          | everything the bot writes to stdout and stderr                                  |
| `types`        | the type checker (`dev.typecheck`)                                              |
| `tunnel`       | the public tunnel                                                               |
| `lifecycle`    | the bot is listening, the pieces it loaded                                      |
| `hmr`          | files left to the bot's hot reload, and what it reloaded                        |
| `commands`     | the application commands the bot registers, changes to them, redeploys          |
| `interactions` | each interaction: the route (`slash:ping`), the piece, how long it took, errors |
| `http`         | each request to the interactions endpoint, with its status (`trace` when fine)  |

The last five come from the bot itself: `stars dev` preloads a small bridge into it (`node --import`) that reports
its events over an IPC channel instead of leaving the CLI to guess from stdout. It needs `@wolfstar/http-framework`
6.1 or later, resolved from the project; without it (or with a build that bundles the framework, as Vite and Nitro
do) those channels stay empty and everything else works as before. A plugin can log on a channel of its own with
`process.send?.({ source: 'stars:bridge', type: 'log', channel: 'gateway', level: 'info', text: 'Shard 0 ready' })`.

`trace` is hidden at start, since it is one line per request. `dev.logs` in `stars.config`, or `--channel` and
`--level`, choose what a session starts with; the log file always receives everything:

```ts
export default defineConfig({
	dev: {
		logs: { channels: ['bot', 'commands', 'interactions'], levels: ['error', 'warn', 'info'] }
	}
});
```

```sh
stars dev --channel hmr,http --channel commands   # only these channels
stars dev --level trace                           # this level and every more severe one
```

| Key                | Action                                                           |
| ------------------ | ---------------------------------------------------------------- |
| `←` / `→`          | select a channel or a level                                      |
| `Tab`              | switch between channels and levels                               |
| `Space`            | show or hide the selected one                                    |
| `s`                | solo: only the selected one; again for all                       |
| `a`                | show every channel and level                                     |
| `Enter`            | fold or unfold the selected group                                |
| `b`                | group the stream by channel                                      |
| `↑` / `↓`, `j`/`k` | scroll (`PgUp`/`PgDn` by page); the footer turns to `paused`     |
| `g` / `G`          | top / back to live                                               |
| `/`                | search the stream (`Esc` clears)                                 |
| `e`                | jump to the last error, keeping its context                      |
| `y` / `n`          | answer a prompt                                                  |
| `r` / `Ctrl+R`     | restart the bot                                                  |
| `d`                | disconnect: stop the bot until the next `r`, builds keep running |
| `o`                | open the local URL in a browser                                  |
| `t`                | toggle a public tunnel (`cloudflared`, or the `dev.tunnel` one)  |
| `i`                | show project, versions, URLs, health, types and session info     |
| `T`                | pick a colour theme (see **Themes** below)                       |
| `l`                | browse the logs full width: select a line, copy it               |
| `v`                | switch between the dashboard and the panel                       |
| `c` / `Ctrl+L`     | clear log history                                                |
| `h` / `?`          | show keyboard shortcuts                                          |
| `q` / `Ctrl+D`     | quit; confirm with `y` while a build/restart is in flight        |
| `Ctrl+C`           | quit immediately from any view                                   |

**Mouse.** In the dashboard the sidebar is clickable, and each click does what a key does:

| Click on                                    | Does                                             |
| ------------------------------------------- | ------------------------------------------------ |
| a channel or a level                        | shows or hides it, like `Space`                  |
| the same one again, or `Alt`/`Ctrl` + click | solo, like `s`                                   |
| a group header (`channels`, `levels`)       | folds or unfolds the group, like `Enter`         |
| a key of the list (`q quit`, `? help`)      | that key, when the entry stands for a single one |
| the wheel, over the logs                    | scrolls three rows                               |

The terminal reports the mouse to `stars dev` while the dashboard is on screen, so selecting text there needs
`Shift` held in most terminals. `dev.mouse: false`, or `--no-mouse` for one session, leaves the mouse to the
terminal; the overlays (`l`, `?`, `i`, `T`), the panel and the plain output never take it.

**Hot reload.** When the bot runs with the framework's `hmr` option enabled, it tells `stars dev` which directories
it watches. A build that only changed pieces in those directories is then left to the bot: the process, its HTTP
server and its connections stay up, and the `hmr` channel shows what was reloaded. A piece is a file the bot loaded
one from, or a new file that could be one. A change to anything else still restarts the bot: the entry, a shared
module, a locale, and also a helper next to the pieces (`_shared.js`, or any file no piece came from), which the bot
imports once and cannot replace. So does a bot without `hmr`, or one that stopped it. `dev.hmr: false` always
restarts. What a build changed is judged by content, since a bundler such as `tsdown` rewrites its whole output on
every rebuild.

**Command refresh.** The bot reports the application commands it registers when it starts and after every hot
reload. When they differ from what it reported before, `stars dev` asks (`Refresh commands? (y/n)`) and, on `y`, has
the bot register them with Discord again. `dev.commands.refresh` picks the behaviour: `'prompt'` (default), `'auto'`
to redeploy without asking, `'off'` to only report the change. Without the interactive UI a `'prompt'` only reports.
A question that is still open survives a restart of the bot, and a `y` given while the bot is stopped or restarting
is carried out once it listens again. A refresh also empties a guild whose last command was removed since the last
deploy, which pushing the registry alone would leave as it was.

**Panel** (`dev.layout: 'panel'`, `--layout panel`, `v`, or a terminal smaller than 90×20): a bottom-aligned panel in
the normal buffer, following the layout and keyboard conventions of
[Nuxt CLI's dev TUI](https://github.com/nuxt/cli/tree/b4b366eafdd9ac4d5b81b6ae7dadda35364252c9/packages/nuxt-cli/src/dev/tui).
It shows a Stars wordmark, aligned URLs, a 20-cell progress bar with elapsed time, status and shortcuts, and folds
the logs away: `l` opens them and `e` the last error. Once ready, the bar gives way to diagnostics and the header
reports the load time. The keys that do not concern the stream are the same as in the dashboard.

Application output (including its banner), build-plugin output and diagnostics stay in the bounded log history and
`.stars/dev.log`. tsdown's entry list and output-size table are suppressed. Closing an overlay restores the view
under it without duplicating output in scrollback. `running` (`READY` in the panel) reports process state unless
`dev.health` is configured; it does not certify that every application plugin loaded successfully.

In the log browser (`l`): arrows or `j/k` select, `PgUp/PgDn` move a page, `g/G` go to the beginning/follow the tail,
`e/w/a` filter errors/warnings/all, `c/b/r` toggle CLI/build/runtime sources, `/` searches, `x` clears, and
`Enter`/`y` copies the selected line on terminals supporting OSC 52 clipboard writes. `q`, `Esc` or the view's
own shortcut closes an overlay rather than quitting the session.

Replace the default wordmark in `stars.config.ts` (up to four lines are displayed, clipped to the terminal width):

```ts
export default defineConfig({
	dev: { banner: ['★ STARYL', 'Twitch notifications'] }
});
```

`dev.banner` also accepts a string containing newlines, or `false` to hide the wordmark. Omit it for Stars branding.
For the application's standalone banner outside the TUI, use `createStarsBanner` from `@wolfstar/start-banner`.

**Themes.** Press `T` to pick a colour theme, like Claude Code's `/theme`: arrows preview it live, `Enter` keeps and saves
it, `Esc` restores the previous one. Available themes are `auto` (follows the terminal background through
`COLORFGBG`, dark when unknown), `dark`, `light`, `dark-daltonized` and `light-daltonized` (blue/orange instead of
green/red, for colour-blind users), and `dark-ansi` and `light-ansi` (only the 16 ANSI colours, so your terminal
palette decides). The theme resolves as `--theme <name>` › `STARS_THEME` › the saved choice › `auto`. It is saved in
`preferences.json` under `$STARS_CONFIG_DIR`, `$XDG_CONFIG_HOME/stars`, `%APPDATA%\stars` or `~/.config/stars`.
`NO_COLOR` still disables colour altogether.

**Plain mode** prints prefixed lines instead (the channel, then the message, with detail lines indented under it;
the bot's own output is passed through untouched) and is selected by `--no-tui`, `STARS_TUI=plain`, redirected input/output,
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

`diff` and `deploy` compare that with what the project defines:

```sh
stars commands diff                 # what a deploy would add (+), change (~) and remove (-)
stars commands diff --check         # the same, failing when anything differs (CI)
stars commands deploy               # show the difference, ask, then overwrite the global scope
stars commands deploy --guild 1234 --yes
```

Commands are declared with builders and decorators that only exist once the bot's modules ran, so `stars` asks the
bot: it starts the built entry (run `stars build` first) with the dev bridge, which loads the pieces, reports the
registry and exits before the bot listens or talks to Discord. This needs `@wolfstar/http-framework` 6.1 or later.
The bot is started as `stars dev` would start it (the same env files, after the `env:options` hook), in the
`NODE_ENV` of the caller, `development` when unset: run `NODE_ENV=production stars commands deploy` to deploy what a
production start registers. It is not a dev session, so `STARS_DEV` is not set.
A command counts as changed when what the project defines no longer matches what is deployed; the fields Discord
fills in on its own (`id`, `version`, defaults such as `nsfw: false`) are ignored. `deploy` is Discord's bulk
overwrite: a deployed command the project no longer defines is deleted, which is why it asks first and refuses to
run without `--yes` outside a terminal, or with `--json`.

### `stars codegen`

Runs the code generators `codegen` in `stars.config` enables, writing their files (`--check` fails with
`CODEGEN_OUTDATED` instead when one is stale, `--json` prints `{ check, results }`):

- `codegen.i18n` types the i18next resources with `@wolfstar/i18next-type-generator`. It is on by default when
  `src/locales/en-US` exists.
- `codegen.commands` types the options of every command from its builder. It is off by default: `true` writes
  `src/@types/commands.d.ts`, `{ output }` picks another file.

```typescript
export default defineConfig({ codegen: { commands: true } });
```

The generated file augments `CommandOptionsRegistry` with one entry per command path (`'ping'`, `'math add'`,
`'subscriptions twitch add'`), and `Command.OptionsOf<'math add'>` reads it, so the handler needs no hand-written
`interface Options` that can drift from the builder:

```typescript
public add(interaction: Command.ChatInputInteraction, { left, right }: Command.OptionsOf<'math add'>) {}
```

Every option has the shape the framework resolves it to at runtime (`user` is `TransformedArguments.User`, `role` is
`APIRole`, ...), a `required` option is not optional, `choices` are a literal union and `channel_types` narrow a
channel. A localized command is keyed by its default name, the one the handler receives. Context menu commands have no
options and are skipped. For an autocomplete, `Command.AutocompleteArguments<Command.OptionsOf<'math add'>>` types
`focused` from the same entry.

The types come from what the bot registers, so loops and factories need no special care: `stars codegen` reads the
commands from the built bot the way `stars commands diff` does (run `stars build` first), by starting it in a mode
that loads its pieces, reports its registry and exits before it listens or talks to Discord. It does not call
`client.login`, but the bot still has to get through its own setup: values it reads while starting (`DISCORD_CLIENT_ID`,
`DISCORD_PUBLIC_KEY`, ...) have to be set, with placeholders in CI where the real secrets are not available:

```sh
DISCORD_CLIENT_ID=1 DISCORD_TOKEN=x DISCORD_PUBLIC_KEY=0 stars codegen --check
```

It is not part of `stars dev` or `stars prepare` (which has no build to read from yet): run `stars codegen` after
changing an option, and `stars codegen --check` in CI to keep the file up to date. A path registered more than once
(a command restricted to several guilds) keeps its first definition.

### `stars doctor`

Checks what a project needs before `stars dev` can do its job, and says what to do about each problem:

```text
stars doctor v2.3.0
  ✔ node        Node.js v24.19.0
  ✔ config      stars.config.ts
  ✔ framework   @wolfstar/http-framework v6.1.0
  ✔ entry       src/main.ts (tsdown)
  ✖ token       DISCORD_TOKEN is not set
                → Set DISCORD_TOKEN in the environment or in the project .env file.
  ⚠ port        Something already listens on http://localhost:3000
                → Stop it, or set another HTTP_PORT, unless it is this bot running.
  ℹ tunnel      No tunnel: Discord cannot reach a bot on localhost
                → Set `dev.tunnel: true` for a cloudflared quick tunnel, or press t in `stars dev`.
  ⚠ prepare     Out of date: .stars/tsconfig.app.json, .stars/tsconfig.node.json
                → Run `stars prepare`.

  1 error(s), 2 warning(s)
```

It covers the Node.js version (and the project's `engines.node`), the configuration and its warnings, the framework
(and whether it is recent enough for the dev bridge), the entry and the build output, `DISCORD_TOKEN`,
`DISCORD_PUBLIC_KEY` and the application id, whether the dev port is free, the tunnel, whether `.stars/` is stale, and
whether a [varlock](https://varlock.dev) `.env.schema` and `env.loader` agree (a schema with another loader, or
`loader: 'varlock'` without the package installed).
`--online` also asks Discord whether the token works and where the application sends its interactions. Nothing is
changed unless you pass `--fix`. `--json` prints `{ ok, checks }`; the exit code is `1` when a check fails.

`--fix` fixes what it can. Today that is a project where varlock loads the environment (`@wolfstar/env-utilities` picks it
when it finds a `.env.schema` and `varlock` is installed) but `stars.config` does not say so: it adds
`env: { loader: 'varlock' }`, creating `stars.config.ts` the way `@wolfstar/create-http-framework` scaffolds it, or editing a
literal `defineConfig({ ... })` or exported object. A configuration it cannot edit safely (a spread, a function, an
`env` that is not a literal) is left alone, and the line to add is printed. It asks first (`--yes` answers for scripts),
and never writes in CI or without a terminal to ask in. `stars prepare`, `build`, `dev` and `info` only report it
(`VARLOCK_LOADER_IMPLICIT`).

### `stars completions`

```sh
eval "$(stars completions bash)"      # ~/.bashrc
eval "$(stars completions zsh)"       # ~/.zshrc
stars completions fish | source       # ~/.config/fish/config.fish
```

The script is generated from the commands the CLI registers, so it completes every command, subcommand and flag
`--help` lists, with their short forms (`-c`) and the `--no-` form of the ones that are on by default (`--no-tui`).

### Type checking, tunnel and logs

Three `dev` options round out the dev loop (all documented in
[`@wolfstar/http-framework`](../http-framework#project-configuration-starsconfig)):

- `dev.typecheck: true` runs a type checker next to the bot and reports type errors on the UI's `types` channel,
  without ever blocking a build or a restart — useful when building with `tsdown`, which does not type-check.
  `dev.typecheck.checker` picks which one: `tsc` (the project's TypeScript, watch mode), `golar` (`golar tsc`, watch
  mode), `tsz` (the tsc-compatible checker, re-run after every build since it has no watch mode), or `auto` — the
  default, which uses `golar` when the project depends on it and `tsc` otherwise.
- Pressing `t` opens and closes a quick tunnel without configuration (`cloudflared`, or the `dev.tunnel.provider` you set). `dev.tunnel: true` opens it at startup so Discord can reach the bot's interactions endpoint from the
  internet, and so does `stars dev --tunnel` for one session, whatever `dev.tunnel` says (`--no-tunnel` keeps it closed at
  start; `t` still opens it). With `--no-tui` the URL is printed on the `tunnel` channel; a string is an https URL you already serve, which the CLI only probes. `dev.tunnel.updateEndpoint` writes
  the URL to the Discord application, and is opt-in because it edits a live application.
  `dev.tunnel: { provider: 'ngrok' }` opens the tunnel through ngrok instead of `cloudflared`, with
  `dev.tunnel.domain` to bind a domain reserved in your ngrok account. It needs the official SDK in the project
  (`pnpm add -D @ngrok/ngrok`, an optional peer of the CLI, loaded only then) and `NGROK_AUTHTOKEN` in the environment
  or the project's `.env`; `stars doctor` checks both. `provider` and `domain` cannot be combined with a `url` you serve.
- `dev.logFile` (default `.stars/dev.log`) mirrors the session's logs to disk, so a run can be read back after the
  terminal UI is gone. Set it to `false` to disable it. It is truncated on every run; `dev.logs.dir` (for example
  `'logs'`) adds one file per run, `dev-<timestamp>.log`, and `dev.logs.keep` (default `10`) says how many stay. Each
  line is `<ISO time> <level> <channel> <message>`, with the detail lines of an entry indented under it, and no entry
  is ever filtered out of a file.

### The build

`tsdown` is configured from `stars.config`, and a base project configures nothing: the entry's directory, one output
file per source file, ESM on Node, `build.outDir`, the tsconfig (`src/tsconfig.json` or `tsconfig.json`), the
extension `build.output` implies, sourcemaps, unbundled dependencies, Nuxt's `~`/`@`/`~~`/`@@` alias prefixes and
the auto imports plugin, and copying `src/locales` to `dist/locales` are all filled in
(the [framework README](../http-framework#the-build-tsdown) lists every default). The `tsdown` block is for what they
cannot know:

Every `@wolfstar/plugin-*` package listed in the project's `dependencies` or `optionalDependencies` is activated
automatically in bundler builds. `stars` injects its `/register` side-effect entrypoint before the application entry,
so projects do not need to maintain bare imports such as `import '@wolfstar/plugin-i18next/register'`. Packages used
only for development are intentionally not activated from `devDependencies`.

```typescript
export default defineConfig({
	tsdown: { dts: true }
});
```

With `future.compatibilityVersion: 3` (end-of-life) an existing `tsdown.config.*` still drives the build and the block
is merged over it (values from `stars.config` win, `plugins` are appended); from `4` on the block is the whole
configuration. The
`vite` block works the same way for `build.tool: 'vite'`. `stars info` shows which file the build is configured from
and which options the block sets.

### Compatibility version

`future.compatibilityVersion` selects the legacy or current defaults, the way Nuxt's own compatibility setting does (see the
[framework README](../http-framework#compatibility-version) for the full reference):

| Version       | What it changes                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `3` (EOL)     | Legacy behaviour: a `tsdown.config.*` drives the build, auto imports off unless asked for; prints `COMPATIBILITY_VERSION_EOL` |
| `4`           | `tsdown` configured from `stars.config` alone, auto imports on and wired in, `'auto'` picks `tsdown` for TypeScript           |
| `5`           | Everything in `4`, plus `env` registered automatically when the project depends on `@wolfstar/env-utilities`                  |
| `6` (default) | Everything in `5`, plus the generated tsconfig split into `.stars/tsconfig.app.json` and `.stars/tsconfig.node.json`          |

### Environment and hooks

`env` mirrors the options of `setup()` from `@wolfstar/env-utilities`: `stars` calls it with them as the first import
of the built entry, before plugin registrations and the bot's own modules. tsdown, Vite and Nitro builds get it
through the entry transform; with `build.tool: 'tsc'` or `'none'` only `stars dev` preloads it (`node --import`).
Nitro leaves it off unless `env` is set explicitly.

```typescript
export default defineConfig({
	env: { prefix: 'BOT_' },
	hooks: {
		'env:options'(options) {
			if (process.env.CI) options.path = '.env.ci';
		},
		build: { done: (outcome) => void (outcome.ok || console.error(outcome.message)) }
	}
});
```

`hooks` are CLI lifecycle hooks run with [`hookable`](https://github.com/unjs/hookable): `config:resolved`,
`env:options`, `prepare:before`/`prepare:done`, `builder:created`, `tsdown:options`, `build:before`/`build:done`,
`dev:start`/`dev:restart`/`dev:close`. They run in the CLI process, never in the bot, in the same order in `stars build` and
`stars dev` (see the framework README for how `stars dev` awaits them). `stars info` lists the env
options and the registered hooks. See the [framework README](../http-framework#environment-env) for the full
reference.

### Experimental flags

`experimental` in `stars.config.*` turns on work that is still landing (see the
[framework README](../http-framework#experimental-flags) for the full reference):

| Flag                 | What it changes                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `enableVite`         | Builds through the project's own `vite` (and allows `build.tool: 'vite'`) instead of `tsdown`                             |
| `enableExternalVite` | The project runs Vite itself; `stars dev` only watches the build output and restarts the bot                              |
| `enableNitro`        | Builds through [Nitro](https://nitro.build) (itself a Vite plugin) instead of `node:http`, deployable to any Nitro preset |

`stars info` prints which flags are on.

### Exit codes

| Code  | Meaning                                                   |
| ----- | --------------------------------------------------------- |
| `0`   | success                                                   |
| `1`   | generic error (including `--check` and `doctor` failures) |
| `2`   | invalid or missing configuration                          |
| `3`   | build failed                                              |
| `130` | interrupted with `SIGINT`                                 |
| `143` | terminated with `SIGTERM`/`SIGHUP`                        |

### Generated TypeScript configuration

The generated compiler options combine `@sapphire/ts-config`, `@sapphire/ts-config/extra-strict`, and
`@sapphire/ts-config/decorators`. The CLI loads these presets and writes their options directly into the file,
so consumers do not need to install Sapphire. This enables strict checks, explicit overrides, and legacy decorators
with metadata. Stars targets ES2022, skips dependency declaration checks, and stores incremental build information
inside `.stars/`. Tsdown and Vite use `ESNext`/`Bundler` with `noEmit`; tsc retains Sapphire's Node16 emit settings.
Project compiler options can override these defaults.

Bundler builds also follow [Nitro's TypeScript configuration](https://github.com/nitrojs/nitro/blob/main/lib/tsconfig.json):
forced module detection, isolated modules, verbatim module syntax, JavaScript sources, `.ts` import extensions,
package.json imports, and ESNext/DOM libraries. Use `import type` and `export type` for type-only dependencies.
These options apply to tsdown and Vite; tsc keeps its emit-compatible settings. Sapphire's decorator options and
the ES2022 target remain in effect. This does not enable Stars' experimental Nitro runtime integration.

From compatibility version 6, `stars prepare` writes two files, the way a Nuxt 4 project has them:

- `.stars/tsconfig.app.json` is the bot: everything under the entry's directory plus the auto imports declaration,
  with the `~`/`@`/`~~`/`@@` paths and the options above. `tsdown` builds with it.
- `.stars/tsconfig.node.json` is what Node runs without a bundler: `stars.config.*`, `vitest.config.*`,
  `tsdown.config.*`, `vite.config.*` and `scripts/**`. It uses `NodeNext` resolution, `types: ["node"]`, no DOM
  library, no aliases or auto imports and no decorators, and leaves the entry's directory to the app project.

Your own `tsconfig.json` only references them:

```json
{
	"files": [],
	"references": [{ "path": "./.stars/tsconfig.app.json" }, { "path": "./.stars/tsconfig.node.json" }]
}
```

`stars typecheck` regenerates `.stars/` and runs your checker (`dev.typecheck.checker`: `golar` or `tsc`; bare `tsc -p`
on that root would check nothing) once per project. `stars dev`'s `dev.typecheck` watches the app project. A root
`tsconfig.json` that still extends `./.stars/tsconfig.json` gets a `TSCONFIG_LEGACY_EXTENDS` warning from
`stars prepare` and `stars doctor`: update it once, or keep `future.compatibilityVersion` at `5`.

On `5` and `4` nothing changes: `stars prepare` writes the single `.stars/tsconfig.json`, which you extend from your
project's `tsconfig.json`:

```json
{
	"extends": "./.stars/tsconfig.json"
}
```

Keep your existing compiler options alongside `extends`. `stars dev` and `stars build` also regenerate the generated
files. For tsdown builds, `@/` and `~/` resolve to the entry file's directory (normally `src/`), while `@@/` and `~~/`
resolve to the project root. Filesystem aliases in `stars.config.ts`'s `tsdown.alias` are included too, with custom
values taking precedence. Legacy builds using a separate tsdown config only include aliases declared in
`stars.config.ts`. Other build tools do not get tsdown aliases, since TypeScript alone does not rewrite imports.

The generated app config includes source files and the auto imports declaration, including a custom `imports.dts`
location. Explicit `include` or `compilerOptions.paths` in your own tsconfig replace the inherited values;
remove manually duplicated paths to use the generated aliases. Generation works with `imports: false` too.
Use `stars prepare --check` to check the generated files without writing them. Do not edit anything in `.stars/` by
hand; keep `.stars/` ignored by Git and run `stars prepare` after installing dependencies on a fresh checkout.

## Server integrations

`@wolfstar/vite-server` and `@wolfstar/nitro-server` provide the Vite and Nitro builders. The CLI loads the
selected integration lazily, passes the resolved `stars.config` and supplies project dependency loading and
plugin registration through `BuilderContext` from `@wolfstar/schema`. Neither server package depends on the CLI
or framework. Existing experimental flags, presets, output directories and `stars dev`/`stars build` commands
are unchanged; install Vite/Nitro in the consuming project as before.
