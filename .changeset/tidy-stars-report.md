---
'@wolfstar/cli': minor
---

Render unexpected errors (and `stars dev` startup crashes) as sourcemapped, syntax-highlighted reports through `my-bad`, the way `nuxt` does, instead of a raw stack trace into the bundled `dist`. Errors the CLI already explains (`CliError`, `ConfigError`) keep their short message and hint. `runMain` is now exported for programmatic use, and the package's sources are reorganised after `nuxt/cli` (`commands/`, `dev/`, `builders/`, `utils/`, `main.ts`, `run.ts`) with no change to the `stars` commands or the public exports.
