# @wolfstar/cli

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
