---
'@wolfstar/http-framework': minor
---

feat: add Hot Module Reloading as a core feature

`Client` now accepts an `hmr` option that starts a `HotModuleReloader` at the end of `Client#load()`. The reloader
watches every path registered in every store and loads, reloads, and unloads pieces in place as their files are
created, changed, and deleted, without restarting the process. It accepts all of chokidar's options plus `enabled`
(default `true`) and `silent` (default `false`), is exposed as `client.hmr`, can be used standalone, and reports every
operation through the new `hmrStart`, `hmrStop`, `hmrPiecesLoaded`, `hmrPieceReloaded`, `hmrPieceUnloaded`, and
`hmrError` client events.

Unloading a command now also deletes its entry from the `ApplicationCommandRegistry`, so reloading a command no longer
leaves the entry of the previous class behind, which would push the command to Discord twice.
