---
'@wolfstar/http-framework': minor
---

Add opt-in startup command registration through `ClientOptions.commands` and incremental `ApplicationCommandRegistry.sync()`. Synchronize global or guild commands, report conflicts, preserve unknown deployed commands by default, and select a single registering process with `when`. Startup registration failures warn without stopping the HTTP server.
