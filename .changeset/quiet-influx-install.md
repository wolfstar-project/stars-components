---
'@wolfstar/shared-influx-pieces': minor
---

Add a `@wolfstar/shared-influx-pieces/module` entry, so the package can be listed in `modules` in `stars.config` instead of importing `/register`. It registers a `@wolfstar/shared-influx-pieces/plugin` plugin that creates `container.influx` when the credentials are set. `@wolfstar/kit` is an optional peer dependency.
