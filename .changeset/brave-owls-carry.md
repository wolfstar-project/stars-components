---
'@wolfstar/schema': minor
'@wolfstar/kit': minor
'@wolfstar/vite-server': minor
'@wolfstar/cli': minor
---

Modules can register a directory of pieces with `ctx.addPiecesDir(directory)`. The directory holds one folder per store (`commands`, `listeners`, …) and is handed to `container.stores.registerPath` before the bot loads, through the `\0stars:modules` virtual module or, for `tsc` and `none` builds, the `node --import` preload and `.stars/modules.mjs`. `ModulesRuntime` gains `piecesDirs`, `stars info` lists them, and a relative path fails with `MODULE_PIECES_INVALID`.
