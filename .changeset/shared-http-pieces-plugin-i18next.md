---
'@wolfstar/shared-http-pieces': patch
---

chore: migrate i18n from `@wolfstar/http-framework-i18n` to `@wolfstar/plugin-i18next`, adopting its native
i18next TypeScript types (dropping the branded `T`/`FT` key helpers) from
[wolfstar-project/plugins#57](https://github.com/wolfstar-project/plugins/pull/57).

Importing `@wolfstar/shared-http-pieces/register` still registers this package's bundled
locales automatically, matching the previous behavior: it now does so by registering a
`preGenericsInitialization` hook that splices `localesPath` into your `Client`'s
`i18n.backend.paths` before `@wolfstar/plugin-i18next` builds its handler. No consumer
changes are required, as long as the register entrypoint is imported before `new Client(...)`.
