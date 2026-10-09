# @wolfstar/cli

## 2.8.0

### Minor Changes

- [#309](https://github.com/wolfstar-project/stars-components/pull/309) [`f1c43e0`](https://github.com/wolfstar-project/stars-components/commit/f1c43e090bbfe7a8a69801a9264b4e7593ad1544) - Make varlock visible in `stars.config`. When a project has a `.env.schema` and `varlock` but `stars.config` does not set `env.loader`, `stars prepare`, `build`, `dev` and `info` now report it (`VARLOCK_LOADER_IMPLICIT`, or `VARLOCK_NOT_INSTALLED` when the schema has no varlock to load it), and `stars doctor` checks that the schema and `env.loader` agree (a schema with another loader, or `loader: 'varlock'` without the package). `stars doctor --fix` writes `env: { loader: 'varlock' }` for you: it creates `stars.config.ts` the way `@wolfstar/create-http-framework` scaffolds it, or edits a literal `defineConfig({ ... })` or exported object, and prints the line to add when the configuration is too dynamic to edit. It asks first (`--yes` answers), and never writes in CI or without a terminal to ask in. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.7.0

### Minor Changes

- [#305](https://github.com/wolfstar-project/stars-components/pull/305) [`a48c529`](https://github.com/wolfstar-project/stars-components/commit/a48c529cb049169080650d16405c9d639f1cd950) - Add ngrok as a second `dev.tunnel` provider. `dev.tunnel: { provider: 'ngrok' }` opens the tunnel through ngrok's official Node SDK instead of a `cloudflared` quick tunnel, and `dev.tunnel.domain` binds a domain reserved in your ngrok account so the hostname survives restarts. `cloudflared` stays the default, so `tunnel: true` and every existing configuration behave as before. `@ngrok/ngrok` is an optional peer dependency that the CLI loads from the project only when the provider is used; the authtoken is read from `NGROK_AUTHTOKEN` in the environment or the project's `.env`. `provider` and `domain` are rejected next to a `url` you already serve, and `domain` without the `ngrok` provider, with the new `TUNNEL_OPTION_CONFLICT` diagnostic. The `t` key, `--tunnel`, `stars info` and `stars doctor` use and report the configured provider, and `stars doctor` checks that the package and the authtoken are present. `@wolfstar/schema` also exports `TUNNEL_PROVIDERS` and `DEFAULT_TUNNEL_PROVIDER`, and `ResolvedTunnelConfig` quick mode now carries `provider` and `domain`. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#308](https://github.com/wolfstar-project/stars-components/pull/308) [`a69125a`](https://github.com/wolfstar-project/stars-components/commit/a69125ad7664462bc648a828f660d7361e95a265) - Make the CLI follow `@wolfstar/env-utilities` when it picks varlock by itself. With `future.compatibilityVersion` 6, a project that depends on `@wolfstar/env-utilities`, has a `.env.schema` (`src/.env.schema`, `.env.schema` or `varlock.loadPath`), has `varlock` installed and sets no `env.path` or `env.loader` now resolves `ResolvedEnvConfig.loader` to `'varlock'`, so `stars dev` and `stars doctor` read the variables through `varlock load` instead of the dotenv files the bot does not load, and `dev.url` no longer takes its port from them. `ResolvedEnvConfig.options` still holds what `stars.config` wrote. `detectVarlock(root)` is exported to inspect a project's schema, installation and dependency. Thanks [@RedStar071](https://github.com/RedStar071)!
- Updated dependencies [[`a48c529`](https://github.com/wolfstar-project/stars-components/commit/a48c529cb049169080650d16405c9d639f1cd950), [`a69125a`](https://github.com/wolfstar-project/stars-components/commit/a69125ad7664462bc648a828f660d7361e95a265)]:
    - @wolfstar/schema@0.10.0
    - @wolfstar/kit@0.2.1
    - @wolfstar/nitro-server@0.2.10
    - @wolfstar/vite-server@0.4.5

## 2.6.1

### Patch Changes

- [#302](https://github.com/wolfstar-project/stars-components/pull/302) [`677dc1f`](https://github.com/wolfstar-project/stars-components/commit/677dc1f07486fd157ec2c59d821ab3b4f7c77809) - Fix `stars dev` asking to redeploy commands that did not change. The bot is no longer started (or restarted) while a build is still writing the output, so it cannot report a part of its commands, and the commands the bot registers are compared with the deployed ones rather than with the previous report, so a command reported as removed and then added again no longer prompts. Accepting the prompt while a build runs is refused with a warning instead of registering an incomplete set of commands. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.6.0

### Minor Changes

- [#295](https://github.com/wolfstar-project/stars-components/pull/295) [`d9066cc`](https://github.com/wolfstar-project/stars-components/commit/d9066cc73035e1675fc7855a04aeb08216fcb482) - Read a module's options from a top-level `stars.config` key (`meta.configKey`). Once the modules are set up, a key that is not built in and that no installed module claimed is reported as `UNKNOWN_OPTION`, with the claimed keys in the fix, so a misspelled key is still an error; the check also runs when `modules` is empty. A `meta.configKey` that is empty, built in, claimed twice or holding a non-object fails with `MODULE_FAILED`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#291](https://github.com/wolfstar-project/stars-components/pull/291) [`d782e5d`](https://github.com/wolfstar-project/stars-components/commit/d782e5d94498f6b2b7216f0533895dd07a3ebf48) - Make the dashboard of `stars dev` clickable. A click on a channel or a level of the sidebar shows or hides it like `Space`, a second click or an `Alt`/`Ctrl` click solos it like `s`, a click on a group header folds the group, a click on a key of the list runs that key, and the wheel scrolls the logs. The new `dev.mouse` option (default `true`) and `stars dev --no-mouse` leave the mouse to the terminal. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#290](https://github.com/wolfstar-project/stars-components/pull/290) [`50a69f7`](https://github.com/wolfstar-project/stars-components/commit/50a69f7da4f8db5bbc8746a6696f6abe29cb9bdb) - Add `stars dev --tunnel` to open the public tunnel at start whatever `dev.tunnel` says (a `cloudflared` quick tunnel when it is off), and `--no-tunnel` to keep it closed at start even when `dev.tunnel` enables it. It works with `--no-tui`, where there is no `t` key: the URL is printed on the `tunnel` channel. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`d782e5d`](https://github.com/wolfstar-project/stars-components/commit/d782e5d94498f6b2b7216f0533895dd07a3ebf48), [`6797590`](https://github.com/wolfstar-project/stars-components/commit/6797590781bf2609f37cb233b49ef14bfea7c23d), [`a5e09ae`](https://github.com/wolfstar-project/stars-components/commit/a5e09aec61803ed9defcfd0078217a30411e6c24)]:
    - @wolfstar/schema@0.9.0
    - @wolfstar/kit@0.2.0
    - @wolfstar/nitro-server@0.2.9
    - @wolfstar/vite-server@0.4.4

## 2.5.0

### Minor Changes

- [#283](https://github.com/wolfstar-project/stars-components/pull/283) [`42c13f4`](https://github.com/wolfstar-project/stars-components/commit/42c13f4b0238524ffdd99bdb14c719da0d725cc5) - Generate a separate app and node tsconfig from `future.compatibilityVersion` `6`, like Nuxt 4, and add `stars typecheck`.

    `stars prepare` (and `stars dev`/`stars build`) writes `.stars/tsconfig.app.json` (the bot sources, with the aliases, auto imports and the bundler options) and `.stars/tsconfig.node.json` (`stars.config.*`, `vitest.config.*`, `tsdown.config.*`, `vite.config.*` and `scripts/**`, with `NodeNext` resolution, `types: ["node"]` and no DOM library) instead of `.stars/tsconfig.json`. `--check` fails when either is outdated, and `stars doctor` and `stars info` report both. The project's own `tsconfig.json` becomes a solution-style file that references them; a root `tsconfig.json` that still extends `./.stars/tsconfig.json` gets a `TSCONFIG_LEGACY_EXTENDS` warning from `stars prepare` and `stars doctor`. Projects that pin `future.compatibilityVersion` to `5` or `4` keep the single `.stars/tsconfig.json`, unchanged.

    `stars typecheck` regenerates `.stars/` and runs the project's checker (`golar` or `tsc`) once on each project, which a bare `tsc -p` on a `files: []` root cannot do. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`1e69874`](https://github.com/wolfstar-project/stars-components/commit/1e698742d1ec940e1cc310a66073af9ce406dddc)]:
    - @wolfstar/schema@0.8.0
    - @wolfstar/kit@0.1.3
    - @wolfstar/nitro-server@0.2.8
    - @wolfstar/vite-server@0.4.3

## 2.4.0

### Minor Changes

- [#275](https://github.com/wolfstar-project/stars-components/pull/275) [`814c8f9`](https://github.com/wolfstar-project/stars-components/commit/814c8f9aed2b5b96150806f09886bac7b76de736) - Generate typed command options from the builders with `stars codegen`.

    `codegen.commands` in `stars.config` (`true`, or `{ output }`, default `src/@types/commands.d.ts`) makes `stars codegen` read the commands from the built bot and write a `CommandOptionsRegistry` entry per command path (`'ping'`, `'math add'`, `'subscriptions twitch add'`). The new `Command.OptionsOf<'math add'>` reads it, so a handler no longer needs a hand-written `interface Options` that can drift from the builder: `required` options are not optional, `choices` are a literal union, `channel_types` narrow the channel and every option has the shape the framework resolves it to. `stars codegen --check` fails with `CODEGEN_OUTDATED` when the file is stale, and `--json` reports it like the i18n generator. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#253](https://github.com/wolfstar-project/stars-components/pull/253) [`05a8443`](https://github.com/wolfstar-project/stars-components/commit/05a8443cf6ba64950c9e2fed5ebdd13c03b6cc06) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`05a8443`](https://github.com/wolfstar-project/stars-components/commit/05a8443cf6ba64950c9e2fed5ebdd13c03b6cc06), [`814c8f9`](https://github.com/wolfstar-project/stars-components/commit/814c8f9aed2b5b96150806f09886bac7b76de736)]:
    - @wolfstar/kit@0.1.2
    - @wolfstar/nitro-server@0.2.7
    - @wolfstar/schema@0.7.0
    - @wolfstar/vite-server@0.4.2

## 2.3.1

### Patch Changes

- [#270](https://github.com/wolfstar-project/stars-components/pull/270) [`a82447b`](https://github.com/wolfstar-project/stars-components/commit/a82447b72657e6cedf9e3513663a9eb33eb901a7) - Fix `stars dev` crashing with an unhandled `cloudflared exited (code=0, ...) before URL was ready` error when the tunnel closes (for example on Ctrl+C). `untun` leaves a connection promise unhandled when cloudflared exits, so the CLI now guards against that one error while the tunnel exists, removes the signal listeners `untun` installs so shutdown goes through `DevService#stop()`, and no longer reports a requested close as a tunnel failure. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.3.0

### Minor Changes

- [#257](https://github.com/wolfstar-project/stars-components/pull/257) [`0f19bf7`](https://github.com/wolfstar-project/stars-components/commit/0f19bf7105ec4f2640269e16b89267fc83f5aeda) - feat(cli): `stars commands diff` and `deploy`, `stars doctor` and shell completions ([#252](https://github.com/wolfstar-project/stars-components/issues/252))

    - `stars commands diff` compares the commands the built bot defines with the ones Discord has deployed (`--check` for
      CI); `stars commands deploy` overwrites them after a confirmation (`--yes` for scripts). The commands are read from
      the bot itself: it is started with the dev bridge, loads its pieces, reports its registry and exits before it
      listens. This needs `@wolfstar/http-framework` 6.1 or later and a built project.
    - `stars doctor` checks the runtime, the framework, the credentials, the dev port, the tunnel and the generated files,
      with a fix for each problem (`--online` also asks Discord, `--json` for scripts).
    - `stars completions <bash|zsh|fish>` prints a completion script generated from the registered commands.
    - `stars info` lists the installed modules and the new `dev` options.

    The `@wolfstar/http-framework` README documents the new `dev` options of `stars.config`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#255](https://github.com/wolfstar-project/stars-components/pull/255) [`9d93ca5`](https://github.com/wolfstar-project/stars-components/commit/9d93ca5cc2dfacfc4210e009881b6be995691bda) - feat(cli): log channels and a bot-to-CLI bridge in `stars dev` ([#252](https://github.com/wolfstar-project/stars-components/issues/252))

    A dev log entry now has a channel (`cli`, `build`, `bot`, `types`, `tunnel`), a `trace` level and optional detail
    lines. `dev.logs`, `--channel` and `--level` choose what is shown at start; the log file always receives everything,
    and `dev.logs.dir` adds one file per run.

    The bot reports what happens inside it over an IPC channel instead of leaving the CLI to guess from stdout: a preload
    registers a plugin on the project's own `Client` (`@wolfstar/http-framework` 6.1 or later). That feeds the `hmr`,
    `commands`, `interactions`, `http` and `lifecycle` channels, and two behaviours:

    - **Hot reload.** With the `hmr` option of the `Client` enabled, a build that only changed pieces is left to the bot
      instead of restarting it. `dev.hmr: false` always restarts.
    - **Command refresh.** When the application commands the bot registers change, `stars dev` reports it and, with
      `dev.commands.refresh: 'auto'`, has the bot redeploy them.

    Changed: the log file prints the channel of an entry where it printed its source (`cli`, `bot`, `types` instead of
    `stars`, `app`, `tsc`), and the detail lines of an entry indented under it. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#256](https://github.com/wolfstar-project/stars-components/pull/256) [`ed1b141`](https://github.com/wolfstar-project/stars-components/commit/ed1b14190cff8d9da1fc803b38d0b1a3dbd27e7c) - feat(cli): a full-screen dashboard for `stars dev` ([#252](https://github.com/wolfstar-project/stars-components/issues/252))

    On a terminal of at least 90x20 `stars dev` opens a dashboard: a sidebar with the state of the session (framework
    version, uptime, port, tunnel, log file) and the channel and level filters, and the log stream next to it with level
    badges, highlighted URLs, paths, names and numbers, blocks for entries with detail lines, and stack frames folded
    under their error. The compact panel is still there (`dev.layout: 'panel'`, `--layout panel`, the `v` key, or a small
    terminal).

    When the application commands the bot registers change, a card under the stream asks (`Refresh commands? (y/n)`)
    before the bot redeploys them, with `dev.commands.refresh: 'prompt'` (the default).

    New keys: `d` stops the bot until the next `r`, `v` switches layout, and the dashboard's own: `←`/`→` and `Tab` to
    select a channel or a level, `Space` to toggle it, `s` to solo it, `a` for all, `b` to group by channel, `g`/`G` for
    the top and back to live, `/` to search. New flag: `--layout`. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`46c6169`](https://github.com/wolfstar-project/stars-components/commit/46c616943363d3db39149a56a8e8e5bd55937b30), [`9374fb0`](https://github.com/wolfstar-project/stars-components/commit/9374fb0b50016ebfcdd28d0940cf8d1262adf85d)]:
    - @wolfstar/schema@0.6.0
    - @wolfstar/kit@0.1.1
    - @wolfstar/nitro-server@0.2.6
    - @wolfstar/vite-server@0.4.1

## 2.2.0

### Minor Changes

- [#247](https://github.com/wolfstar-project/stars-components/pull/247) [`2d9bf55`](https://github.com/wolfstar-project/stars-components/commit/2d9bf55a29ee43503d415edc800fea4c5a313630) - Add `modules` to `stars.config`: a list of package names or `[name, options]` tuples, installed by the CLI with `@wolfstar/kit`'s `setupModules` before `config:resolved`. The resolved configuration gains `modules` and `runtime` (the runtime plugins and auto-import presets the modules contributed). Runtime plugins are registered in the bot through a `\0stars:modules` virtual module imported before the legacy `/register` imports, which skip packages listed in `modules`, and, for the `tsc` and `none` build tools, through a `node --import` preload in `stars dev` and a `.stars/modules.mjs` file written by `stars prepare` for production (`stars build`, `stars prepare` and `stars info` report a `MODULES_PRELOAD_REQUIRED` warning that points at it; it loads `env` first through `.stars/env.mjs`). A failing module is reported as a `MODULE_FAILED` diagnostic (exit code 2). Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`2d9bf55`](https://github.com/wolfstar-project/stars-components/commit/2d9bf55a29ee43503d415edc800fea4c5a313630), [`2d9bf55`](https://github.com/wolfstar-project/stars-components/commit/2d9bf55a29ee43503d415edc800fea4c5a313630)]:
    - @wolfstar/kit@0.1.0
    - @wolfstar/schema@0.5.0
    - @wolfstar/vite-server@0.4.0
    - @wolfstar/nitro-server@0.2.5

## 2.1.0

### Minor Changes

- [#243](https://github.com/wolfstar-project/stars-components/pull/243) [`19e6bf6`](https://github.com/wolfstar-project/stars-components/commit/19e6bf62dfbf2dba11644d08bbc2570179f0c177) - Add an `env` option to `stars.config` that mirrors `@wolfstar/env-utilities`' setup options and is registered
  automatically as the first import of the built entry, before plugin registrations and the bot's own modules. Add
  Nuxt-style lifecycle `hooks` (`config:resolved`, `env:options`, `prepare:*`, `builder:created`, `tsdown:options`,
  `build:*`, `dev:*`) run with `hookable`.

    `future.compatibilityVersion: 5` is now the default: it is version 4 plus the automatic `env` registration, which
    turns on when the project depends on `@wolfstar/env-utilities` (and stays off with Nitro). Version 4 is still
    supported. Version 3 is end-of-life: it still works, now reports a `COMPATIBILITY_VERSION_EOL` warning, and will be
    removed in the next major.

    Projects generated by `@wolfstar/create-http-framework` with the `tsdown` or `vite` build no longer call `setup()`
    from `@wolfstar/env-utilities` by hand; `tsc` and JavaScript projects keep it and set `env: false`. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`19e6bf6`](https://github.com/wolfstar-project/stars-components/commit/19e6bf62dfbf2dba11644d08bbc2570179f0c177)]:
    - @wolfstar/schema@0.4.0
    - @wolfstar/vite-server@0.3.0
    - @wolfstar/nitro-server@0.2.4

## 2.0.4

### Patch Changes

- Updated dependencies [[`3aa572c`](https://github.com/wolfstar-project/stars-components/commit/3aa572c78006b3dffdba8ff804c781498fef6153)]:
    - @wolfstar/schema@0.3.0
    - @wolfstar/nitro-server@0.2.3
    - @wolfstar/vite-server@0.2.4

## 2.0.3

### Patch Changes

- [#227](https://github.com/wolfstar-project/stars-components/pull/227) [`ae15eef`](https://github.com/wolfstar-project/stars-components/commit/ae15eef45d0f85c630b8563b5436b9cd6379e64d) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`ae15eef`](https://github.com/wolfstar-project/stars-components/commit/ae15eef45d0f85c630b8563b5436b9cd6379e64d)]:
    - @wolfstar/nitro-server@0.2.2
    - @wolfstar/schema@0.2.1
    - @wolfstar/vite-server@0.2.3

## 2.0.2

### Patch Changes

- [#231](https://github.com/wolfstar-project/stars-components/pull/231) [`909c96a`](https://github.com/wolfstar-project/stars-components/commit/909c96a8f63d8f14100aee17063cffe723a6855e) - fix: require `@wolfstar/vite-server` `^0.2.2`, so upgrading the CLI always brings the plugin registration fix from [#222](https://github.com/wolfstar-project/stars-components/issues/222) (only packages exporting `/register` get their registration injected) instead of keeping a locked `0.2.1` that crashes builds depending on `@wolfstar/plugin-cache`, `@wolfstar/plugin-gateway` or `@wolfstar/plugin-sharder` with `ERR_PACKAGE_PATH_NOT_EXPORTED` Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.1

### Patch Changes

- [#210](https://github.com/wolfstar-project/stars-components/pull/210) [`7f15974`](https://github.com/wolfstar-project/stars-components/commit/7f159741397a26412ba4cd7f0b5b1d5324326335) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`ad7a743`](https://github.com/wolfstar-project/stars-components/commit/ad7a74356b4bad6a1563687f2f05e4de2212f215)]:
    - @wolfstar/nitro-server@0.2.1
    - @wolfstar/vite-server@0.2.1

## 2.0.0

### Major Changes

- [#209](https://github.com/wolfstar-project/stars-components/pull/209) [`6d970e5`](https://github.com/wolfstar-project/stars-components/commit/6d970e5e3e93f5a229d3f49a33b494cbe698df41) - Split the `stars.config.*` schema and loader (`defineConfig`, `loadStarsConfig`, `configDiagnostics` and friends) out
  of `@wolfstar/http-framework` into a new package, [`@wolfstar/schema`](https://npmx.dev/package/@wolfstar/schema),
  and made `@wolfstar/http-framework` depend on `@wolfstar/cli` for its own `stars` binary — the same split Nuxt has
  between `nuxt`, `@nuxt/cli` and `@nuxt/schema`.

    - `@wolfstar/http-framework/config` re-exports `@wolfstar/schema`'s public surface unchanged, so existing
      `import { defineConfig } from '@wolfstar/http-framework/config'` code keeps working with no changes needed.
    - `@wolfstar/http-framework` now depends on `@wolfstar/cli` and ships a `stars` bin (`bin/stars.mjs`, re-exporting
      `@wolfstar/cli/cli`), the way `nuxt` ships `nuxi`'s binary — installing `@wolfstar/http-framework` is now enough to
      get the `stars` command, no separate `@wolfstar/cli` install required.
    - **Breaking for `@wolfstar/cli`:** it no longer depends on `@wolfstar/http-framework` (matching `@nuxt/cli` having no
      dependency on `nuxt`) — it now depends on `@wolfstar/schema` for the config schema/loader instead. Projects
      that installed `@wolfstar/cli` without also depending on `@wolfstar/http-framework` directly (uncommon, since the
      CLI has nothing to build without it) now need to add `@wolfstar/http-framework` themselves; every project scaffolded
      by `@wolfstar/create-http-framework`, or that already depends on `@wolfstar/http-framework`, is unaffected.
      `@wolfstar/cli`'s own public exports (`loadStarsConfig`, `configDiagnostics`, `ConfigDiagnosticCode`,
      `ResolvedStarsConfig`, re-exported from `@wolfstar/schema`) are unchanged.

    This was needed because `@wolfstar/cli` already depended on `@wolfstar/http-framework`: adding the reverse dependency
    (for the new `stars` bin) without this split would have made the two packages depend on each other, which this
    monorepo's build graph (and any tool resolving workspace dependencies) cannot build. Thanks [@RedStar071](https://github.com/RedStar071)!

### Minor Changes

- [#209](https://github.com/wolfstar-project/stars-components/pull/209) [`6d970e5`](https://github.com/wolfstar-project/stars-components/commit/6d970e5e3e93f5a229d3f49a33b494cbe698df41) - Extract optional Vite and Nitro builders into dedicated server packages, with a shared host context and builder lifecycle contract in schema. Preserve CLI configuration, lazy loading, project-local dependencies, and plugin registration. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`6d970e5`](https://github.com/wolfstar-project/stars-components/commit/6d970e5e3e93f5a229d3f49a33b494cbe698df41), [`6d970e5`](https://github.com/wolfstar-project/stars-components/commit/6d970e5e3e93f5a229d3f49a33b494cbe698df41)]:
    - @wolfstar/schema@0.2.0
    - @wolfstar/nitro-server@0.2.0
    - @wolfstar/vite-server@0.2.0

## 1.0.0

### Major Changes

- [#205](https://github.com/wolfstar-project/stars-components/pull/205) [`18eda16`](https://github.com/wolfstar-project/stars-components/commit/18eda168cd486c24913feddd83f132b4f84739bb) - Replaced the hand-rolled `ConfigError` (`@wolfstar/http-framework/config`) and `CliError` (`@wolfstar/cli`) error
  classes with [`nostics`](https://github.com/vercel-labs/nostics) `Diagnostic`s: stable, typed diagnostic codes with a
  `why`, an actionable `fix`, and a docs link, instead of ad hoc `code`/`hint`/`path`/`file` fields.

    - `@wolfstar/http-framework/config` no longer exports `ConfigError`/`ConfigErrorOptions`. Every `stars.config.*`
      validation and load failure is now built from `configDiagnostics` (also exported) and thrown as a `nostics`
      `Diagnostic` — catch it with `instanceof Diagnostic` (from `nostics`) instead of `instanceof ConfigError`. The
      option path that used to live on `.path` is folded into the diagnostic's message; the configuration file that used
      to live on `.file` is now in `.sources`.
    - `@wolfstar/cli` no longer exports `CliError`/`CliErrorOptions`. Its own errors are now built from the new
      `cliDiagnostics` catalog (also exported) and are `Diagnostic` instances too. `formatError` renders a `Diagnostic`
      with `nostics`' own ANSI formatter; `exitCodeOf` maps `stars.config.*` diagnostic codes to exit code `2` and
      `BUILD_FAILED` to `3`, the same as before.

    `ExitCode`, `exitCodeOf` and `formatError` keep their existing exports and behaviour for every other case (an
    unexpected error still renders as a crash report, a non-`Error` value still stringifies). Thanks [@RedStar071](https://github.com/RedStar071)!

### Minor Changes

- [#207](https://github.com/wolfstar-project/stars-components/pull/207) [`9b71e86`](https://github.com/wolfstar-project/stars-components/commit/9b71e86b2a53b6467991764efb2e2c211c4a4131) - Implemented `experimental.enableNitro`: `stars dev`/`stars build` now build the bot through
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
    - `@wolfstar/cli`: `NitroBuilder` also turns on Vite's native `resolve.tsconfigPaths` (see
      https://nitro.build/examples/import-alias), and `stars prepare`'s generated `.stars/tsconfig.json` now emits the
      same `~`/`@`/`~~`/`@@` aliases `build.tool: 'tsdown'` already gets whenever `experimental.enableNitro` is on — a
      project's own `tsconfig.json#paths`/package.json `imports` just work under Nitro too, without a
      `vite-tsconfig-paths` plugin. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`9b71e86`](https://github.com/wolfstar-project/stars-components/commit/9b71e86b2a53b6467991764efb2e2c211c4a4131), [`18eda16`](https://github.com/wolfstar-project/stars-components/commit/18eda168cd486c24913feddd83f132b4f84739bb)]:
    - @wolfstar/http-framework@5.0.0

## 0.7.0

### Minor Changes

- [#204](https://github.com/wolfstar-project/stars-components/pull/204) [`d99bf71`](https://github.com/wolfstar-project/stars-components/commit/d99bf718c6207655e8d13fc8da57f2218877fd7d) - `stars dev` now has colour themes, like Claude Code. Press `T` in the interactive UI to preview and pick `dark`, `light`, the colour-blind friendly `dark-daltonized`/`light-daltonized`, the terminal-palette-only `dark-ansi`/`light-ansi`, or `auto` (follows the terminal background). The choice is saved to `~/.config/stars/preferences.json` (`$XDG_CONFIG_HOME`, `%APPDATA%` or `$STARS_CONFIG_DIR`). `--theme <name>` and `STARS_THEME` override the saved theme for one run. The UI now paints with semantic theme colours, so body text keeps the terminal's own foreground and stays readable on light backgrounds. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#201](https://github.com/wolfstar-project/stars-components/pull/201) [`f6e4256`](https://github.com/wolfstar-project/stars-components/commit/f6e4256b2ce3920b447302371333a8845058b69a) - `stars dev` now shuts down like Turborepo: the first `Ctrl+C` (or `SIGINT`/`SIGTERM`/`SIGHUP`) stops the bot gracefully and prints a hint, a second one kills the bot and its helper processes right away instead of waiting for `dev.killTimeout`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#200](https://github.com/wolfstar-project/stars-components/pull/200) [`241bed1`](https://github.com/wolfstar-project/stars-components/commit/241bed15de74a7e126828e2960eb0c0e45c80104) - Render unexpected errors (and `stars dev` startup crashes) as sourcemapped, syntax-highlighted reports through `my-bad`, the way `nuxt` does, instead of a raw stack trace into the bundled `dist`. Errors the CLI already explains (`CliError`, `ConfigError`) keep their short message and hint. `runMain` is now exported for programmatic use, and the package's sources are reorganised after `nuxt/cli` (`commands/`, `dev/`, `builders/`, `utils/`, `main.ts`, `run.ts`) with no change to the `stars` commands or the public exports. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.6.1

### Patch Changes

- [#195](https://github.com/wolfstar-project/stars-components/pull/195) [`76f3cf4`](https://github.com/wolfstar-project/stars-components/commit/76f3cf4d9eb1633f3706014f5b5c17539ac20a0e) - Fixed the `dev.tunnel` quick tunnel: it now opens the `cloudflared` tunnel through `untun` instead of spawning `cloudflared` directly and scraping its stdout for the URL with a regex. `untun` manages the `cloudflared` binary itself (downloading it if missing) and exposes the tunnel URL and lifecycle programmatically, which also fixes the tunnel never closing when spawning `cloudflared` failed silently. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.6.0

### Minor Changes

- [#192](https://github.com/wolfstar-project/stars-components/pull/192) [`673ea73`](https://github.com/wolfstar-project/stars-components/commit/673ea73674d7323168f095410bc8c8e326fc769e) - Automatically activate `@wolfstar/plugin-*` dependencies during bundler builds by injecting each plugin's `/register` side-effect entrypoint before the application entry. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.5.0

### Minor Changes

- [#191](https://github.com/wolfstar-project/stars-components/pull/191) [`baf401e`](https://github.com/wolfstar-project/stars-components/commit/baf401e7e2857edc2b2b860349898802ac91d15f) - Generate an extendable .stars/tsconfig.json during prepare, dev and build with TypeScript paths matching tsdown aliases, and extend it in scaffolded projects.

    Include Sapphire base, extra-strict, and decorators compiler options in the generated configuration, with ESNext/Bundler and noEmit for bundler builds.

    Align bundler compiler options with Nitro: isolated modules, verbatim syntax, JavaScript sources, explicit TypeScript extensions, package imports, and web API types. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#178](https://github.com/wolfstar-project/stars-components/pull/178) [`6d63859`](https://github.com/wolfstar-project/stars-components/commit/6d63859d5eede5367868daa8e9ab89a739407de1) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`6d63859`](https://github.com/wolfstar-project/stars-components/commit/6d63859d5eede5367868daa8e9ab89a739407de1)]:
    - @wolfstar/http-framework@4.0.1

## 0.4.0

### Minor Changes

- [#182](https://github.com/wolfstar-project/stars-components/pull/182) [`93544d5`](https://github.com/wolfstar-project/stars-components/commit/93544d53776cb46aa3126996435388a80834335b) - Make the Stars workflow convention-first: compatibility version 4 is now the default, `stars dev` forces development mode, `src/locales` is copied and watched automatically, and environment files are discovered under both `src/` and the project root.

    The interactive dev UI now supports `t` to open or close a public quick tunnel without configuring `dev.tunnel`. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`93544d5`](https://github.com/wolfstar-project/stars-components/commit/93544d53776cb46aa3126996435388a80834335b), [`93544d5`](https://github.com/wolfstar-project/stars-components/commit/93544d53776cb46aa3126996435388a80834335b)]:
    - @wolfstar/http-framework@4.0.0

## 0.3.0

### Minor Changes

- [#168](https://github.com/wolfstar-project/stars-components/pull/168) [`b516cad`](https://github.com/wolfstar-project/stars-components/commit/b516cadec4faef9e77b9a4af6d41016a6a4225a6) - feat: align the stars dev terminal UI with Nuxt's pinned panel and folded logs

    The tsdown builder now leaves dependencies external with `deps.neverBundle`, removing the deprecated option and
    keeping shared dependencies external for dynamically loaded pieces. Its entry list, target and output-size table
    are suppressed; warnings and errors remain available in the log browser and log file.

    The bottom-aligned panel displays an animated Stars wordmark, aligned URLs, actual build-phase progress and elapsed
    time, then readiness timing and diagnostic counts. `dev.banner` accepts custom text/lines or `false` to hide the
    wordmark. Log, help and session-info views use the alternate screen and restore the panel when closed. Logs support
    search, source/level filters, selection, copying, and jumping to the last error with context. Stack frames are dimmed
    and no longer counted as separate errors; Node warnings are classified as warnings rather than errors.

    Rebuild state and duration now reset on Rolldown's per-build hook, including recovery from a failed build. Reduced
    motion preserves the elapsed clock, and redirected input, dumb terminals and small panes get a safe plain fallback. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#169](https://github.com/wolfstar-project/stars-components/pull/169) [`f9bc134`](https://github.com/wolfstar-project/stars-components/commit/f9bc134f5161b4757fc254febf85df6bacb6a9f9) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

- [#172](https://github.com/wolfstar-project/stars-components/pull/172) [`4f27ebe`](https://github.com/wolfstar-project/stars-components/commit/4f27ebe7861216c88699b4987b11e1d4327c4e80) - fix(deps): update dependency chokidar to v5 Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`4f27ebe`](https://github.com/wolfstar-project/stars-components/commit/4f27ebe7861216c88699b4987b11e1d4327c4e80), [`b516cad`](https://github.com/wolfstar-project/stars-components/commit/b516cadec4faef9e77b9a4af6d41016a6a4225a6)]:
    - @wolfstar/http-framework@3.6.0

## 0.2.0

### Minor Changes

- [#164](https://github.com/wolfstar-project/stars-components/pull/164) [`05fca34`](https://github.com/wolfstar-project/stars-components/commit/05fca3434124f40a41f9af5dc4e6d083f570acc0) - feat: build `tsdown` from `stars.config`, and wire auto imports into it

    `stars build` and `stars dev` now derive the whole `tsdown` build from `stars.config`, so a base project configures
    nothing: every source file next to `entry` (minus `*.test.*`/`*.spec.*`), emitted one-to-one so the stores keep
    loading pieces from `dist/commands` at runtime, ESM on `platform: 'node'`, the project's tsconfig, sourcemaps and
    treeshaking on, minification off, dependencies left in `node_modules` (`deps.skipNodeModulesBundle`), no declaration
    files, and the output extension `build.output` implies. These are the options the WolfStar bots already keep in their
    own `tsdown.config.ts`, so migrating one is deleting the file and moving its plugins across.

    The build also ships Nuxt's alias prefixes: `~` and `@` resolve to the entry's directory, `~~` and `@@` to the
    project root. A target written as a relative path (`'./src/lib'`) is resolved against the project root the way every
    other path in `stars.config` is.

    The project's `tsdown` block is layered on top: its values win, and its `plugins` and `alias` entries are added to
    what `stars` contributes rather than replacing them.

    The auto imports plugin is injected by the CLI instead of by the project's own configuration file, so
    `future: { compatibilityVersion: 4 }` is all a project needs for the framework's exports and its `src/lib/**`,
    `src/utils/**` to be usable without an `import` statement.

    With `future.compatibilityVersion: 3` a `tsdown.config.*` still drives the build and everything above is merged over
    it, so options can move across one at a time.

    The `vite` block finally reaches Vite too: it was resolved and validated, but never passed to `vite.build()`.

    `stars info` gains a `Future` section with the compatibility version in effect, and two `Build` rows: the file the
    build tool is configured from, and the option names the `tsdown`/`vite` block sets. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`05fca34`](https://github.com/wolfstar-project/stars-components/commit/05fca3434124f40a41f9af5dc4e6d083f570acc0), [`05fca34`](https://github.com/wolfstar-project/stars-components/commit/05fca3434124f40a41f9af5dc4e6d083f570acc0)]:
    - @wolfstar/http-framework@3.5.0

## 0.1.0

### Minor Changes

- [#158](https://github.com/wolfstar-project/stars-components/pull/158) [`f513392`](https://github.com/wolfstar-project/stars-components/commit/f51339281ad17ae83ef779a4fe97d4502551f59c) - Round out the `stars dev` loop with the pieces a Discord bot needs while developing:

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
      commands, then a confirmation, instead of an all-or-nothing prompt. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#158](https://github.com/wolfstar-project/stars-components/pull/158) [`f513392`](https://github.com/wolfstar-project/stars-components/commit/f51339281ad17ae83ef779a4fe97d4502551f59c) - feat: add typed project configuration and the `stars` CLI

    Mirroring how Nuxt splits `nuxt.config`/`defineNuxtConfig` (owned by the `nuxt` framework) from `nuxi` (a separate CLI
    that calls into it), the typed `stars.config.{ts,mts,cts,js,mjs,cjs}` schema and loader are owned by
    `@wolfstar/http-framework` (`@wolfstar/http-framework/config`: `defineConfig`, `loadStarsConfig`, `ConfigError`), not
    by the CLI — any tool can resolve a project's configuration without depending on `@wolfstar/cli`. The config module
    has no side effects; importing it (or a `stars.config.ts` that imports it) never starts the bot. Configuration is
    discovered from the working directory or passed with `--config`, paths are resolved from the file, every option has a
    default, and invalid options raise a `ConfigError` with a stable code, the offending option path, the file, and an
    actionable hint.

    `@wolfstar/cli` ships the `stars` binary that consumes it: `dev`, `build`, `info`, `codegen`.

    - `stars dev` builds through the project's `tsdown` or `tsc` (or plain-watches JavaScript projects), starts the bot and
      restarts it after every successful build. `dev.url` needs no configuration: it is detected from `HTTP_PORT`
      (env var, `.env.local`/`.env`, or `dev.env`) or `3000`, the way Vite's and Nuxt's dev servers do, and `localhost` is
      swapped for `127.0.0.1` at runtime if that is what is actually reachable. On a terminal it renders an interactive UI
      (lifecycle, uptime, restart reason, build state, URL/health, filtered logs, `r` restart, `c` clear, `h`/`?` help,
      `q` quit); `--no-tui`, `STARS_TUI=plain`, CI and redirected output switch to plain line output. Both modes honour
      `NO_COLOR`, reduced motion, and stop the bot cleanly on `SIGINT`/`SIGTERM` with consistent exit codes. `ConfigError`s
      from the framework are reported with exit code `2`.
    - `stars build` runs the build tool once (exit code `3` on failure).
    - `stars info [--json]` prints the resolved configuration and environment.
    - `stars codegen [--check] [--json]` runs the i18next type generation.

    `stars --help` and `stars --version` never load the configuration machinery, so they stay fast. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#158](https://github.com/wolfstar-project/stars-components/pull/158) [`f513392`](https://github.com/wolfstar-project/stars-components/commit/f51339281ad17ae83ef779a4fe97d4502551f59c) - Add an `experimental` block to `stars.config.*`, in the shape Nuxt's own `experimental` config has: opt-in
  booleans, all `false` by default, each documented with what it changes and what it still needs.

    - `experimental.enableVite` lets a project build through its own `vite` instead of `tsdown` — `build.tool` accepts
      `'vite'` only with the flag on, and `'auto'` only then detects a `vite.config.*` (so a `vite.config.*` that
      belongs to something else in the repository never takes the bot's build over).
    - `experimental.enableExternalVite` leaves the build to the project: `stars dev` starts no build of its own, it
      watches what the external one writes and restarts the bot, keeping restarts, health, the tunnel, type checking
      and the panel working.
    - `experimental.enableNitro` is declared but not implemented yet: it needs the framework's Fetch adapter, so
      `stars dev`/`stars build` refuse it with an actionable error instead of silently ignoring it.

    `stars info` reports which flags are on. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`214a6aa`](https://github.com/wolfstar-project/stars-components/commit/214a6aa40aa1925baa149924612c499d9bffba50), [`f513392`](https://github.com/wolfstar-project/stars-components/commit/f51339281ad17ae83ef779a4fe97d4502551f59c), [`f513392`](https://github.com/wolfstar-project/stars-components/commit/f51339281ad17ae83ef779a4fe97d4502551f59c), [`f513392`](https://github.com/wolfstar-project/stars-components/commit/f51339281ad17ae83ef779a4fe97d4502551f59c)]:
    - @wolfstar/http-framework@3.4.0
