---
'@wolfstar/schema': minor
'@wolfstar/cli': minor
'@wolfstar/http-framework': minor
---

Generate typed command options from the builders with `stars codegen`.

`codegen.commands` in `stars.config` (`true`, or `{ output }`, default `src/@types/commands.d.ts`) makes `stars codegen` read the commands from the built bot and write a `CommandOptionsRegistry` entry per command path (`'ping'`, `'math add'`, `'subscriptions twitch add'`). The new `Command.OptionsOf<'math add'>` reads it, so a handler no longer needs a hand-written `interface Options` that can drift from the builder: `required` options are not optional, `choices` are a literal union, `channel_types` narrow the channel and every option has the shape the framework resolves it to. `stars codegen --check` fails with `CODEGEN_OUTDATED` when the file is stale, and `--json` reports it like the i18n generator.
