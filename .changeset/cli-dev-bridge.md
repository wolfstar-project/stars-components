---
'@wolfstar/cli': minor
---

feat(cli): log channels and a bot-to-CLI bridge in `stars dev` (#252)

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
`stars`, `app`, `tsc`), and the detail lines of an entry indented under it.
