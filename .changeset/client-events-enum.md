---
'@wolfstar/http-framework': minor
---

feat: add an `Events` enum for the client event names

Every event emitted by the `Client` is now also available as a member of the new `Events` enum, mirroring discord.js'
`Events`, so `client.on(Events.CommandError, ...)` can be used instead of the `'commandError'` string literal. The
enum members hold the same names the client has always emitted, so existing string literals keep working and can be
mixed with the enum freely. The library itself now emits through the enum, and the new `ClientEventName` type aliases
`keyof ClientEvents` for typing event names.
