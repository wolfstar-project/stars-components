---
'@wolfstar/http-framework': major
'@wolfstar/cli': major
---

Replaced the hand-rolled `ConfigError` (`@wolfstar/http-framework/config`) and `CliError` (`@wolfstar/cli`) error
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
unexpected error still renders as a crash report, a non-`Error` value still stringifies).
