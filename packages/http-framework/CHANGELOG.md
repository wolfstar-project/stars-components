# Changelog

## 3.4.0

### Minor Changes

- [#159](https://github.com/wolfstar-project/stars-components/pull/159) [`214a6aa`](https://github.com/wolfstar-project/stars-components/commit/214a6aa40aa1925baa149924612c499d9bffba50) - Add a built-in logger to the core. `container.logger` is now always available and defaults to a minimal `Logger` that writes to the console, filtered by `LogLevel`. The new `ILogger` interface is the extension point: a plugin can set `options.logger.instance` from a `preGenericsInitialization` hook to replace the built-in implementation, and `new Client({ logger: { level: LogLevel.Debug } })` tunes the default one. The framework internals (HMR and the command router) now log through `container.logger` instead of `console`. Thanks [@RedStar071](https://github.com/RedStar071)!

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

## 3.3.0

### Minor Changes

- [#157](https://github.com/wolfstar-project/stars-components/pull/157) [`6364824`](https://github.com/wolfstar-project/stars-components/commit/63648244c6b422f43fb4a237936beea077c8f0ad) - feat: add an `Events` enum for the client event names

    Every event emitted by the `Client` is now also available as a member of the new `Events` enum, mirroring discord.js'
    `Events`, so `client.on(Events.CommandError, ...)` can be used instead of the `'commandError'` string literal. The
    enum members hold the same names the client has always emitted, so existing string literals keep working and can be
    mixed with the enum freely. The library itself now emits through the enum, and the new `ClientEventName` type aliases
    `keyof ClientEvents` for typing event names. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#155](https://github.com/wolfstar-project/stars-components/pull/155) [`ce9496a`](https://github.com/wolfstar-project/stars-components/commit/ce9496a7aced1200d3b4b322d6a336e5a60debb3) - feat: add Hot Module Reloading as a core feature

    `Client` now accepts an `hmr` option that starts a `HotModuleReloader` at the end of `Client#load()`. The reloader
    watches every path registered in every store and loads, reloads, and unloads pieces in place as their files are
    created, changed, and deleted, without restarting the process. It accepts all of chokidar's options plus `enabled`
    (default `true`) and `silent` (default `false`), is exposed as `client.hmr`, can be used standalone, and reports every
    operation through the new `hmrStart`, `hmrStop`, `hmrPiecesLoaded`, `hmrPieceReloaded`, `hmrPieceUnloaded`, and
    `hmrError` client events.

    Unloading a command now also deletes its entry from the `ApplicationCommandRegistry`, so reloading a command no longer
    leaves the entry of the previous class behind, which would push the command to Discord twice. Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.2.1

### Patch Changes

- [#151](https://github.com/wolfstar-project/stars-components/pull/151) [`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8) - build: replace tsc with golar as typechecker, bump typescript to 7.0.2

    `typecheck` scripts now run `golar tsc` instead of `tsc` directly. This is a dev-tooling-only change with no effect on published output. Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.2.0

### Minor Changes

- [#131](https://github.com/wolfstar-project/stars-components/pull/131) [`f7b31cc`](https://github.com/wolfstar-project/stars-components/commit/f7b31cc0eb5f9a284e64590e28eadbf470e88f64) - Add a set of utility decorators, modelled after `@sapphire/decorators` and adapted to HTTP-only Discord interactions.

    `ApplyOptions` configures any `Piece` without writing a constructor. `RequiresGuildContext` and `RequiresDMContext` gate a method by interaction context. `RequiresUserPermissions` and `RequiresClientPermissions` check `member.permissions` and `app_permissions`, throwing a `MissingPermissionsError` — which the client emits as `commandError` — when the check fails. `Enumerable` and `EnumerableMethod` control property visibility, and `createClassDecorator`, `createMethodDecorator`, `createProxy`, and `createFunctionPrecondition` are exported for building your own.

    The existing `Register*` decorators and `RestrictGuildIds` are now built on those same primitives. `createClassDecorator` and `createMethodDecorator` return the decorator with the signature they were given rather than widening it to `ClassDecorator` / `MethodDecorator`, so those decorators keep rejecting a target that is not a `Command`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#132](https://github.com/wolfstar-project/stars-components/pull/132) [`2504cd7`](https://github.com/wolfstar-project/stars-components/commit/2504cd7b42b470f9146ff6c27d6e8da20e6c3ac8) - feat: add Sapphire-style error types

    Adds a `UserError` base class along with `ArgumentError`, `PreconditionError`, and an `Identifiers` enum, all modelled after `@sapphire/framework`'s error hierarchy but adapted to the HTTP framework (interaction options instead of message arguments, precondition names instead of `Precondition` pieces).

    `ChatInputRouterError` now extends `UserError`, so it exposes `identifier` and `context` in addition to its existing `key`, `command`, `group`, `subcommand`, and `path` properties, and it is now exported from the package root together with the new errors. Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.1.4

### Patch Changes

- [#126](https://github.com/wolfstar-project/stars-components/pull/126) [`abf7f77`](https://github.com/wolfstar-project/stars-components/commit/abf7f77462ae91c9840a08e273899e4027f2253a) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 3.1.3

### Patch Changes

- [#102](https://github.com/wolfstar-project/stars-components/pull/102) [`2d38bab`](https://github.com/wolfstar-project/stars-components/commit/2d38bab7745fb898809cd65de3337b9bcf42d976) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 3.1.2

### Patch Changes

- [#107](https://github.com/wolfstar-project/stars-components/pull/107) [`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf) - Restore npm provenance attestation on publish for all packages Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.1.1

### Patch Changes

- [#93](https://github.com/wolfstar-project/stars-components/pull/93) [`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5) - chore: upgrade tsdown to 0.22.14 and migrate `deps.skipNodeModulesBundle` to `deps.neverBundle` Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.1.0

### Minor Changes

- [#85](https://github.com/wolfstar-project/stars-components/pull/85) [`69dd6c8`](https://github.com/wolfstar-project/stars-components/commit/69dd6c87775b0725b50bfd518f54f4138cc07139) - Add an optional `Command#registerApplicationCommands(registry)` instance method, mirroring `@sapphire/framework`'s `ApplicationCommandRegistry` API, so chat input, subcommand, subcommand group, and context menu commands can be registered imperatively instead of via TypeScript decorators. This also makes the framework usable from plain JavaScript, where TS decorators aren't available. Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.0.0

### Major Changes

- [#65](https://github.com/wolfstar-project/stars-components/pull/65) [`2d15b7d`](https://github.com/wolfstar-project/stars-components/commit/2d15b7d480b402a7334c01bb0116f0b73960ed8c) - Add a Sapphire-style plugin system. Plugins extend the new `Plugin` base class and define static lifecycle hooks (`preGenericsInitialization`, `preInitialization`, `postInitialization`, `preLoad`, `postListen`) which are registered through `Client.use(plugin)` and run across the `Client` constructor, `load()`, and `listen()`. A `pluginLoaded` event is emitted as each hook runs.

## 2.3.1

### Patch Changes

- [#59](https://github.com/wolfstar-project/stars-components/pull/59) [`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db) - Add provenance attestation to publishConfig for all packages

## 2.3.0

### Minor Changes

- [#43](https://github.com/wolfstar-project/stars-components/pull/43) [`b567a26`](https://github.com/wolfstar-project/stars-components/commit/b567a26073285c2852b8e5b1221a0de24d0c63c9) - introduce dedicated library for testing for http-framework

### Patch Changes

- [#43](https://github.com/wolfstar-project/stars-components/pull/43) [`b567a26`](https://github.com/wolfstar-project/stars-components/commit/b567a26073285c2852b8e5b1221a0de24d0c63c9) - feat: add @wolfstar/http-framework-test-utils package
