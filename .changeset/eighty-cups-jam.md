---
'@wolfstar/http-framework': minor
'@wolfstar/http-framework-decorators': major
---

Add a set of utility decorators to `@wolfstar/http-framework`, modelled after `@sapphire/decorators` and adapted to HTTP-only Discord interactions.

`ApplyOptions` configures any `Piece` without writing a constructor. `RequiresGuildContext` and `RequiresDMContext` gate a method by interaction context. `RequiresUserPermissions` and `RequiresClientPermissions` check `member.permissions` and `app_permissions`, throwing a `MissingPermissionsError` — which the client emits as `commandError` — when the check fails. `Enumerable` and `EnumerableMethod` control property visibility, and `createClassDecorator`, `createMethodDecorator`, `createProxy`, and `createFunctionPrecondition` are exported for building your own.

The existing `Register*` decorators and `RestrictGuildIds` are now built on those same primitives. `createClassDecorator` and `createMethodDecorator` return the decorator with the signature they were given rather than widening it to `ClassDecorator` / `MethodDecorator`, so those decorators keep rejecting a target that is not a `Command`.

Also adds `@wolfstar/http-framework-decorators`, which re-exports all of the above for projects that prefer a dedicated package. It has no behaviour of its own; the decorators live in the framework so that the framework's own decorators can use them without a dependency cycle.
