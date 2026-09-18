---
'@wolfstar/cli': minor
---

`stars dev` now shuts down like Turborepo: the first `Ctrl+C` (or `SIGINT`/`SIGTERM`/`SIGHUP`) stops the bot gracefully and prints a hint, a second one kills the bot and its helper processes right away instead of waiting for `dev.killTimeout`.
