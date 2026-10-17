---
'@wolfstar/shared-http-pieces': minor
---

Add a `@wolfstar/shared-http-pieces/module` entry, so the package can be listed in `modules` in `stars.config` instead of importing `/register`. It adds the bundled locales with `ctx.addLocales` and registers a `@wolfstar/shared-http-pieces/pieces` plugin that loads the shared commands and listeners. `@wolfstar/kit` is an optional peer dependency.
