---
'@wolfstar/create-http-framework': patch
---

Fixed the generated entry point calling `client.load({ baseUserDirectory: join(dirname(fileURLToPath(import.meta.url)), 'commands') })`, which made the framework look for commands in a doubled-up `commands/commands` directory (since `client.load()` already appends each store's name to `baseUserDirectory`). Scaffolded projects now call `client.load()` with no arguments, matching how the framework auto-detects the `commands` directory next to the entry file.
