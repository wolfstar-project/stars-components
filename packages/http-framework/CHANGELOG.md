# Changelog

## 3.2.0

### Minor Changes

- [#131](https://github.com/wolfstar-project/stars-components/pull/131) [`f7b31cc`](https://github.com/wolfstar-project/stars-components/commit/f7b31cc0eb5f9a284e64590e28eadbf470e88f64) - Add a set of utility decorators, modelled after `@sapphire/decorators` and adapted to HTTP-only Discord interactions.

    `ApplyOptions` configures any `Piece` without writing a constructor. `RequiresGuildContext` and `RequiresDMContext` gate a method by interaction context. `RequiresUserPermissions` and `RequiresClientPermissions` check `member.permissions` and `app_permissions`, throwing a `MissingPermissionsError` — which the client emits as `commandError` — when the check fails. `Enumerable` and `EnumerableMethod` control property visibility, and `createClassDecorator`, `createMethodDecorator`, `createProxy`, and `createFunctionPrecondition` are exported for building your own.

    The existing `Register*` decorators and `RestrictGuildIds` are now built on those same primitives. `createClassDecorator` and `createMethodDecorator` return the decorator with the signature they were given rather than widening it to `ClassDecorator` / `MethodDecorator`, so those decorators keep rejecting a target that is not a `Command`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#132](https://github.com/wolfstar-project/stars-components/pull/132) [`2504cd7`](https://github.com/wolfstar-project/stars-components/commit/2504cd7b42b470f9146ff6c27d6e8da20e6c3ac8) - feat: add Sapphire-style error types

    Adds a `UserError` base class along with `ArgumentError`, `PreconditionError`, and an `Identifiers` enum, all modelled after `@sapphire/framework`'s error hierarchy but adapted to the HTTP framework (interaction options instead of message arguments, precondition names instead of `Precondition` pieces).

    `ChatInputRouterError` now extends `UserError`, so it exposes `identifier` and `context` in addition to its existing `key`, `command`, `group`, `subcommand`, and `path` properties, and it is now exported from the package root together with the new errors. Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.1.4

### Patch Changes

- [#126](https://github.com/wolfstar-project/stars-components/pull/126) [`abf7f77`](https://github.com/wolfstar-project/stars-components/commit/abf7f77462ae91c9840a08e273899e4027f2253a) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 3.1.3

### Patch Changes

- [#102](https://github.com/wolfstar-project/stars-components/pull/102) [`2d38bab`](https://github.com/wolfstar-project/stars-components/commit/2d38bab7745fb898809cd65de3337b9bcf42d976) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 3.1.2

### Patch Changes

- [#107](https://github.com/wolfstar-project/stars-components/pull/107) [`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf) - Restore npm provenance attestation on publish for all packages Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.1.1

### Patch Changes

- [#93](https://github.com/wolfstar-project/stars-components/pull/93) [`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5) - chore: upgrade tsdown to 0.22.14 and migrate `deps.skipNodeModulesBundle` to `deps.neverBundle` Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.1.0

### Minor Changes

- [#85](https://github.com/wolfstar-project/stars-components/pull/85) [`69dd6c8`](https://github.com/wolfstar-project/stars-components/commit/69dd6c87775b0725b50bfd518f54f4138cc07139) - Add an optional `Command#registerApplicationCommands(registry)` instance method, mirroring `@sapphire/framework`'s `ApplicationCommandRegistry` API, so chat input, subcommand, subcommand group, and context menu commands can be registered imperatively instead of via TypeScript decorators. This also makes the framework usable from plain JavaScript, where TS decorators aren't available. Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.0.0

### Major Changes

- [#65](https://github.com/wolfstar-project/stars-components/pull/65) [`2d15b7d`](https://github.com/wolfstar-project/stars-components/commit/2d15b7d480b402a7334c01bb0116f0b73960ed8c) - Add a Sapphire-style plugin system. Plugins extend the new `Plugin` base class and define static lifecycle hooks (`preGenericsInitialization`, `preInitialization`, `postInitialization`, `preLoad`, `postListen`) which are registered through `Client.use(plugin)` and run across the `Client` constructor, `load()`, and `listen()`. A `pluginLoaded` event is emitted as each hook runs.

## 2.3.1

### Patch Changes

- [#59](https://github.com/wolfstar-project/stars-components/pull/59) [`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db) - Add provenance attestation to publishConfig for all packages

## 2.3.0

### Minor Changes

- [#43](https://github.com/wolfstar-project/stars-components/pull/43) [`b567a26`](https://github.com/wolfstar-project/stars-components/commit/b567a26073285c2852b8e5b1221a0de24d0c63c9) - introduce dedicated library for testing for http-framework

### Patch Changes

- [#43](https://github.com/wolfstar-project/stars-components/pull/43) [`b567a26`](https://github.com/wolfstar-project/stars-components/commit/b567a26073285c2852b8e5b1221a0de24d0c63c9) - feat: add @wolfstar/http-framework-test-utils package
