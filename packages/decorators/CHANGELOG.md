# @wolfstar/decorators

## 0.1.1

### Patch Changes

- [#253](https://github.com/wolfstar-project/stars-components/pull/253) [`05a8443`](https://github.com/wolfstar-project/stars-components/commit/05a8443cf6ba64950c9e2fed5ebdd13c03b6cc06) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 0.1.0

### Minor Changes

- [#238](https://github.com/wolfstar-project/stars-components/pull/238) [`3aa572c`](https://github.com/wolfstar-project/stars-components/commit/3aa572c78006b3dffdba8ff804c781498fef6153) - Moved the utility decorators out of `@wolfstar/http-framework` into a new package,
  [`@wolfstar/decorators`](https://npmx.dev/package/@wolfstar/decorators), mirroring the split between
  `@sapphire/framework` and `@sapphire/decorators`.

    - **Breaking (`@wolfstar/http-framework`):** `ApplyOptions`, `RequiresGuildContext`, `RequiresDMContext`,
      `RequiresUserPermissions`, `RequiresClientPermissions`, `Enumerable`, `EnumerableMethod`, `createClassDecorator`,
      `createMethodDecorator`, `createProxy`, `createFunctionPrecondition`, and the `PieceConstructor`/`ContextFallback`
      types are no longer exported by the framework. Install `@wolfstar/decorators` and import them from there instead;
      their behaviour is unchanged. The `Register*` decorators and `RestrictGuildIds` stay in the framework.
    - `@wolfstar/decorators` declares `@wolfstar/http-framework` as a peer dependency.
    - `@wolfstar/schema`: `@wolfstar/decorators` is now one of the default `imports.presets`, so projects using the `stars`
      CLI's auto imports keep getting the decorators without an explicit import once the package is installed. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`3aa572c`](https://github.com/wolfstar-project/stars-components/commit/3aa572c78006b3dffdba8ff804c781498fef6153)]:
    - @wolfstar/http-framework@6.0.0
