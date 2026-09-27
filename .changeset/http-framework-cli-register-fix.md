---
'@wolfstar/http-framework': patch
---

fix: require the `@wolfstar/cli` release with the plugin registration fix from #222, so upgrading the framework alone also stops `stars build`/`stars dev` from crashing with `ERR_PACKAGE_PATH_NOT_EXPORTED` on `@wolfstar/plugin-cache`, `@wolfstar/plugin-gateway` or `@wolfstar/plugin-sharder`
