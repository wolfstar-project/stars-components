---
'@wolfstar/http-framework': minor
---

Add a Sapphire-style plugin system. Plugins extend the new `Plugin` base class and define static lifecycle hooks (`preGenericsInitialization`, `preInitialization`, `postInitialization`, `preLoad`, `postListen`) which are registered through `Client.use(plugin)` and run across the `Client` constructor, `load()`, and `listen()`. A `pluginLoaded` event is emitted as each hook runs.
