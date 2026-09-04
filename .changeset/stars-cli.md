---
'@wolfstar/http-framework': minor
'@wolfstar/cli': minor
---

feat: add typed project configuration and the `stars` CLI

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

`stars --help` and `stars --version` never load the configuration machinery, so they stay fast.
