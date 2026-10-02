---
'@wolfstar/schema': minor
'@wolfstar/vite-server': minor
'@wolfstar/cli': minor
---

Add `modules` to `stars.config`: a list of package names or `[name, options]` tuples, installed by the CLI with `@wolfstar/kit`'s `setupModules` before `config:resolved`. The resolved configuration gains `modules` and `runtime` (the runtime plugins and auto-import presets the modules contributed). Runtime plugins are registered in the bot through a `\0stars:modules` virtual module imported before the legacy `/register` imports, which skip packages listed in `modules`, and, for the `tsc` and `none` build tools, through a `node --import` preload in `stars dev` and a `.stars/modules.mjs` file written by `stars prepare` for production (`stars build` and `stars prepare` print a `MODULES_PRELOAD_REQUIRED` warning that points at it). A failing module is reported as a `MODULE_FAILED` diagnostic (exit code 2).
