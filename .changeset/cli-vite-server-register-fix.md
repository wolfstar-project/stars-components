---
'@wolfstar/cli': patch
---

fix: require `@wolfstar/vite-server` `^0.2.2`, so upgrading the CLI always brings the plugin registration fix from #222 (only packages exporting `/register` get their registration injected) instead of keeping a locked `0.2.1` that crashes builds depending on `@wolfstar/plugin-cache`, `@wolfstar/plugin-gateway` or `@wolfstar/plugin-sharder` with `ERR_PACKAGE_PATH_NOT_EXPORTED`
