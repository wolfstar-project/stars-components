---
'@wolfstar/http-framework': minor
---

Add an optional `Command#registerApplicationCommands(registry)` instance method, mirroring `@sapphire/framework`'s `ApplicationCommandRegistry` API, so chat input, subcommand, subcommand group, and context menu commands can be registered imperatively instead of via TypeScript decorators. This also makes the framework usable from plain JavaScript, where TS decorators aren't available.
