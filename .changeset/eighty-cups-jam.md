---
'@wolfstar/http-framework': minor
---

Add a set of utility decorators, modelled after `@sapphire/decorators` and adapted to HTTP-only Discord interactions.

`ApplyOptions` configures any `Piece` without writing a constructor. `RequiresGuildContext` and `RequiresDMContext` gate a method by interaction context. `RequiresUserPermissions` and `RequiresClientPermissions` check `member.permissions` and `app_permissions`, throwing a `MissingPermissionsError` — which the client emits as `commandError` — when the check fails. `Enumerable` and `EnumerableMethod` control property visibility, and `createClassDecorator`, `createMethodDecorator`, `createProxy`, and `createFunctionPrecondition` are exported for building your own.

The existing `Register*` decorators and `RestrictGuildIds` are now built on those same primitives. `createClassDecorator` and `createMethodDecorator` return the decorator with the signature they were given rather than widening it to `ClassDecorator` / `MethodDecorator`, so those decorators keep rejecting a target that is not a `Command`.
