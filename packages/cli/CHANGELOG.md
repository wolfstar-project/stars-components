# @wolfstar/cli

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
