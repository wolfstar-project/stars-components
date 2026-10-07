---
'@wolfstar/http-framework': minor
---

Route the `UserError` a command, an autocomplete handler, or an interaction handler throws to new `*Denied` events instead of the `*Error` ones. `chatInputCommandDenied` and `contextMenuCommandDenied` (also `Events.ChatInputCommandDenied` and `Events.ContextMenuCommandDenied`) replace `commandError` for commands, `autocompleteDenied` replaces `autocompleteError`, and `interactionHandlerDenied` replaces `interactionHandlerError`; all of them carry `(error: UserError, context)`. Anything that is not a `UserError` still goes to the `*Error` events, and the `error` event and the HTTP response are unchanged. The new `isUserError` helper does the check, falling back to the shape of the error for a `UserError` from another copy of the package.

This changes what a listener on `commandError`, `autocompleteError`, or `interactionHandlerError` receives: a `UserError` (including the `PreconditionError` of `@wolfstar/decorators`) no longer reaches it, so a listener that replies to the user with one has to move to the matching `*Denied` event.
