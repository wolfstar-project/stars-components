# Changelog

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
