---
'@wolfstar/cli': minor
---

Let `stars commands clean --name` take the path of a subcommand or a group (`settings server`, `settings group sub`). Discord cannot delete one, so the deployed command is sent back with a `PATCH` without that entry while the parent and its other subcommands stay; paths under one command share a request, and a path that matches nothing still fails with `COMMAND_NOT_FOUND`. Removing a command's last subcommand deletes the command, and the confirmation says so. `--json` output gains a `removed` list next to `deleted`.
