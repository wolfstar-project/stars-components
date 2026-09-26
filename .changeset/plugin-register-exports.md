---
'@wolfstar/vite-server': patch
---

fix: only auto-register installed `@wolfstar/plugin-*` packages that export a `/register` entrypoint, so library packages such as `@wolfstar/plugin-cache`, `@wolfstar/plugin-gateway` and `@wolfstar/plugin-sharder` no longer break `stars build`/`stars dev` (#217)
