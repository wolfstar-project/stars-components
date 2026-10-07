---
'@wolfstar/decorators': patch
---

Document that the `PreconditionError` thrown by `RequiresUserPermissions` and `RequiresClientPermissions` is emitted as `chatInputCommandDenied`, `contextMenuCommandDenied`, or `interactionHandlerDenied` with `@wolfstar/http-framework` 6.3.0, instead of `commandError`.
