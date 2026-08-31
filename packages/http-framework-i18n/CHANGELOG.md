# Changelog

## 2.0.0

### Major Changes

- [#30](https://github.com/wolfstar-project/stars-components/pull/30) [`170156a`](https://github.com/wolfstar-project/stars-components/commit/170156aed32c73c4b2d355e727f1136df7cfac55) - feat: adopt i18next v25 native TypeScript types

    `@wolfstar/http-framework-i18n` now targets i18next v25 with namespace-aware `getT` / `getSupportedLanguageT` helpers and drops the deprecated `T`, `FT`, `resolveKey`, and `resolveUserKey` APIs. `@wolfstar/shared-http-pieces` removes the hand-maintained `LanguageKeys` export in favour of the generated `CustomTypeOptions` augmentation and direct `TFunction<'commands/shared'>` usage. Adds `@wolfstar/i18next-type-generator`, the CLI used to generate that augmentation from locale JSON files. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#30](https://github.com/wolfstar-project/stars-components/pull/30) [`170156a`](https://github.com/wolfstar-project/stars-components/commit/170156aed32c73c4b2d355e727f1136df7cfac55) - Deprecate `@wolfstar/http-framework-i18n` in favour of
  [`@wolfstar/plugin-i18next`](https://www.npmjs.com/package/@wolfstar/plugin-i18next), the official
  `@wolfstar/http-framework` plugin that supersedes it. No further feature releases are planned for this package. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#30](https://github.com/wolfstar-project/stars-components/pull/30) [`170156a`](https://github.com/wolfstar-project/stars-components/commit/170156aed32c73c4b2d355e727f1136df7cfac55) - Fix `getT`, `getSupportedLanguageT`, and `getSupportedUserLanguageT` failing to type-check once a consumer augments
  i18next's `CustomTypeOptions.resources` (e.g. via `@wolfstar/i18next-type-generator`): the generic namespace
  parameter defaulted to i18next's `DefaultNamespace` (`"translation"`), which stops satisfying the narrowed
  `Namespace` constraint as soon as any resources are declared. The default now resolves to `Namespace` itself. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#151](https://github.com/wolfstar-project/stars-components/pull/151) [`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8) - build: replace tsc with golar as typechecker, bump typescript to 7.0.2

    `typecheck` scripts now run `golar tsc` instead of `tsc` directly. This is a dev-tooling-only change with no effect on published output. Thanks [@RedStar071](https://github.com/RedStar071)!

- Updated dependencies [[`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8)]:
    - @wolfstar/i18next-backend@2.0.11

## 1.2.6

### Patch Changes

- [#143](https://github.com/wolfstar-project/stars-components/pull/143) [`09dd484`](https://github.com/wolfstar-project/stars-components/commit/09dd484926963690f84c39a24a2069b2622624dc) - Deprecate `@wolfstar/http-framework-i18n` in favour of
  [`@wolfstar/plugin-i18next`](https://www.npmjs.com/package/@wolfstar/plugin-i18next), the official
  `@wolfstar/http-framework` plugin that supersedes it. No further feature releases are planned for this package. Thanks [@RedStar071](https://github.com/RedStar071)!

## 1.2.5

### Patch Changes

- [#107](https://github.com/wolfstar-project/stars-components/pull/107) [`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf) - Restore npm provenance attestation on publish for all packages Thanks [@RedStar071](https://github.com/RedStar071)!
- Updated dependencies [[`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf)]:
    - @wolfstar/i18next-backend@2.0.10

## 1.2.4

### Patch Changes

- [#93](https://github.com/wolfstar-project/stars-components/pull/93) [`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5) - chore: upgrade tsdown to 0.22.14 and migrate `deps.skipNodeModulesBundle` to `deps.neverBundle` Thanks [@RedStar071](https://github.com/RedStar071)!
- Updated dependencies [[`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5)]:
    - @wolfstar/i18next-backend@2.0.9

## 1.2.3

### Patch Changes

- [#59](https://github.com/wolfstar-project/stars-components/pull/59) [`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db) - Add provenance attestation to publishConfig for all packages
- Updated dependencies [[`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db)]:
    - @wolfstar/i18next-backend@2.0.8
