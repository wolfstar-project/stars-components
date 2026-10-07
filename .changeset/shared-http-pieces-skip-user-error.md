---
'@wolfstar/shared-http-pieces': patch
---

Stop reporting a `UserError` to Sentry from the `error` listener. With `@wolfstar/http-framework` 6.3.0 a `UserError` is also emitted as a `*Denied` event, and the `commandError`, `autocompleteError`, and `interactionHandlerError` listeners no longer receive it.
