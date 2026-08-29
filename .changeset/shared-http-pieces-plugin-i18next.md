---
'@wolfstar/shared-http-pieces': patch
---

chore: migrate i18n from `@wolfstar/http-framework-i18n` to `@wolfstar/plugin-i18next`

Importing `@wolfstar/shared-http-pieces/register` still registers this package's bundled
locales automatically, matching the previous behavior: it now does so by registering a
`preGenericsInitialization` hook that splices `localesPath` into your `Client`'s
`i18n.backend.paths` before `@wolfstar/plugin-i18next` builds its handler. No consumer
changes are required, as long as the register entrypoint is imported before `new Client(...)`.
