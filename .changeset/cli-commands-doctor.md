---
'@wolfstar/cli': minor
'@wolfstar/http-framework': patch
---

feat(cli): `stars commands diff` and `deploy`, `stars doctor` and shell completions (#252)

- `stars commands diff` compares the commands the built bot defines with the ones Discord has deployed (`--check` for
  CI); `stars commands deploy` overwrites them after a confirmation (`--yes` for scripts). The commands are read from
  the bot itself: it is started with the dev bridge, loads its pieces, reports its registry and exits before it
  listens. This needs `@wolfstar/http-framework` 6.1 or later and a built project.
- `stars doctor` checks the runtime, the framework, the credentials, the dev port, the tunnel and the generated files,
  with a fix for each problem (`--online` also asks Discord, `--json` for scripts).
- `stars completions <bash|zsh|fish>` prints a completion script generated from the registered commands.
- `stars info` lists the installed modules and the new `dev` options.

The `@wolfstar/http-framework` README documents the new `dev` options of `stars.config`.
