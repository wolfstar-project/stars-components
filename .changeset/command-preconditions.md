---
'@wolfstar/http-framework': minor
---

Add the `preconditions` option to `Command.Options`: a list of functions, typed as `Precondition`, that receive the interaction and the command and return a `Result` (`ok()` to let the command run, `err(userError)` to deny it). They run in order before a chat input or context menu method, and the first denial skips the method and is emitted as `chatInputCommandDenied` or `contextMenuCommandDenied`. This is a reduced version of the `@sapphire/framework` preconditions: no store, no global preconditions, no `Accepted` event, and autocomplete is not checked. `Precondition`, `PreconditionResult` and `runPreconditions` are exported.
