---
'@wolfstar/http-framework': minor
---

Add `ModalSubmitInteraction#fields`, a `ModalInteractionOptionResolver` from `@wolfstar/discord-utilities` to read submitted text inputs, selects and uploaded files by custom ID. `@wolfstar/http-framework` now depends on `@wolfstar/discord-utilities`, and its `discord-api-types` range is raised to `^0.38.30` to match that package's peer range. Adds a README section on the typed interaction accessors. Resolves #359.
