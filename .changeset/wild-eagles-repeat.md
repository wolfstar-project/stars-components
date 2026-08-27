---
'@wolfstar/http-framework': minor
---

feat: add Sapphire-style error types

Adds a `UserError` base class along with `ArgumentError`, `PreconditionError`, and an `Identifiers` enum, all modelled after `@sapphire/framework`'s error hierarchy but adapted to the HTTP framework (interaction options instead of message arguments, precondition names instead of `Precondition` pieces).

`ChatInputRouterError` now extends `UserError`, so it exposes `identifier` and `context` in addition to its existing `key`, `command`, `group`, `subcommand`, and `path` properties, and it is now exported from the package root together with the new errors.
