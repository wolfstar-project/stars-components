---
'@wolfstar/http-framework-decorators': major
---

Add `@wolfstar/http-framework-decorators`, a set of utility decorators for `@wolfstar/http-framework` modelled after `@sapphire/decorators` and adapted to HTTP-only Discord interactions.

It ships `ApplyOptions` for configuring any `Piece` without a constructor, `RequiresGuildContext` and `RequiresDMContext` for restricting a method by interaction context, `RequiresUserPermissions` and `RequiresClientPermissions` for checking `member.permissions` and `app_permissions` (throwing a `MissingPermissionsError` that the client emits as `commandError`), `Enumerable` and `EnumerableMethod` for controlling property visibility, and the `createClassDecorator`, `createMethodDecorator`, `createProxy`, and `createFunctionPrecondition` primitives for building your own.
