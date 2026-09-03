---
'@wolfstar/http-framework': minor
---

Add a built-in logger to the core. `container.logger` is now always available and defaults to a minimal `Logger` that writes to the console, filtered by `LogLevel`. The new `ILogger` interface is the extension point: a plugin can set `options.logger.instance` from a `preGenericsInitialization` hook to replace the built-in implementation, and `new Client({ logger: { level: LogLevel.Debug } })` tunes the default one. The framework internals (HMR and the command router) now log through `container.logger` instead of `console`.
