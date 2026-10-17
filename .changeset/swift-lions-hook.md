---
'@wolfstar/schema': minor
'@wolfstar/kit': minor
'@wolfstar/vite-server': minor
'@wolfstar/cli': minor
---

Modules can run code in the bot at the client's lifecycle points. `hooks` in `defineModule` accepts `client:preGenericsInitialization`, `client:preInitialization`, `client:postInitialization`, `client:preLoad` and `client:postListen`, given by source (`{ from, export }`, a function called with `(client, clientOptions)`), and `ctx.addClientHook(name, source)` does the same from `setup`. The hooks of a module share one runtime plugin named after it. `ModulesRuntime` gains `clientHooks`, `stars info` lists them, and a bad hook fails with `MODULE_HOOK_INVALID`.
