---
'@wolfstar/decorators': minor
'@wolfstar/http-framework': major
'@wolfstar/schema': minor
---

Moved the utility decorators out of `@wolfstar/http-framework` into a new package,
[`@wolfstar/decorators`](https://npmx.dev/package/@wolfstar/decorators), mirroring the split between
`@sapphire/framework` and `@sapphire/decorators`.

- **Breaking (`@wolfstar/http-framework`):** `ApplyOptions`, `RequiresGuildContext`, `RequiresDMContext`,
  `RequiresUserPermissions`, `RequiresClientPermissions`, `Enumerable`, `EnumerableMethod`, `createClassDecorator`,
  `createMethodDecorator`, `createProxy`, `createFunctionPrecondition`, and the `PieceConstructor`/`ContextFallback`
  types are no longer exported by the framework. Install `@wolfstar/decorators` and import them from there instead;
  their behaviour is unchanged. The `Register*` decorators and `RestrictGuildIds` stay in the framework.
- `@wolfstar/decorators` declares `@wolfstar/http-framework` as a peer dependency.
- `@wolfstar/schema`: `@wolfstar/decorators` is now one of the default `imports.presets`, so projects using the `stars`
  CLI's auto imports keep getting the decorators without an explicit import once the package is installed.
