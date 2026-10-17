---
'@wolfstar/http-framework': minor
'@wolfstar/schema': minor
'@wolfstar/kit': minor
'@wolfstar/vite-server': minor
'@wolfstar/cli': minor
---

Modules can add a directory of locales with `ctx.addLocales(directory)`. The directory is laid out as `<language>/<namespace>.json`, and its namespaces are read when the module is set up. A runtime plugin generated into the `\0stars:modules` source (and the `node --import` preload) merges it into the client's `i18n` option before `@wolfstar/plugin-i18next` builds its handler, keeping the project's own languages directory. `ModulesRuntime` gains `locales`, `stars info` lists them, and a bad directory fails with `MODULE_LOCALES_INVALID`. `@wolfstar/http-framework` now re-exports `getRootData` from `@sapphire/pieces`, which the generated plugin uses to find the default languages directory.
