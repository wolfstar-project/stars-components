# Changelog

## 2.0.1

### Patch Changes

- [#146](https://github.com/wolfstar-project/stars-components/pull/146) [`7d7f296`](https://github.com/wolfstar-project/stars-components/commit/7d7f29623ff205256207f30b8df1279956208a12) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

- [#169](https://github.com/wolfstar-project/stars-components/pull/169) [`f9bc134`](https://github.com/wolfstar-project/stars-components/commit/f9bc134f5161b4757fc254febf85df6bacb6a9f9) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

- [#171](https://github.com/wolfstar-project/stars-components/pull/171) [`ca2744c`](https://github.com/wolfstar-project/stars-components/commit/ca2744ce4a3f2d77e712d672414b542719dd3af0) - fix(deps): update dependency @wolfstar/plugin-i18next to v2 Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`b516cad`](https://github.com/wolfstar-project/stars-components/commit/b516cadec4faef9e77b9a4af6d41016a6a4225a6)]:
    - @wolfstar/http-framework@3.6.0

## 2.0.0

### Major Changes

- [#30](https://github.com/wolfstar-project/stars-components/pull/30) [`170156a`](https://github.com/wolfstar-project/stars-components/commit/170156aed32c73c4b2d355e727f1136df7cfac55) - feat: adopt i18next v25 native TypeScript types

    `@wolfstar/http-framework-i18n` now targets i18next v25 with namespace-aware `getT` / `getSupportedLanguageT` helpers and drops the deprecated `T`, `FT`, `resolveKey`, and `resolveUserKey` APIs. `@wolfstar/shared-http-pieces` removes the hand-maintained `LanguageKeys` export in favour of the generated `CustomTypeOptions` augmentation and direct `TFunction<'commands/shared'>` usage. Adds `@wolfstar/i18next-type-generator`, the CLI used to generate that augmentation from locale JSON files. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#151](https://github.com/wolfstar-project/stars-components/pull/151) [`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8) - build: replace tsc with golar as typechecker, bump typescript to 7.0.2

    `typecheck` scripts now run `golar tsc` instead of `tsc` directly. This is a dev-tooling-only change with no effect on published output. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#144](https://github.com/wolfstar-project/stars-components/pull/144) [`d3209cd`](https://github.com/wolfstar-project/stars-components/commit/d3209cd08a5148d0d0d5dc0b79d80a07ffd529d6) - chore: migrate i18n from `@wolfstar/http-framework-i18n` to `@wolfstar/plugin-i18next`, adopting its native
  i18next TypeScript types (dropping the branded `T`/`FT` key helpers) from
  [wolfstar-project/plugins#57](https://github.com/wolfstar-project/plugins/pull/57).

    Importing `@wolfstar/shared-http-pieces/register` still registers this package's bundled
    locales automatically, matching the previous behavior: it now does so by registering a
    `preGenericsInitialization` hook that splices `localesPath` into your `Client`'s
    `i18n.backend.paths` before `@wolfstar/plugin-i18next` builds its handler. No consumer
    changes are required, as long as the register entrypoint is imported before `new Client(...)`. Thanks [@RedStar071](https://github.com/RedStar071)!

- Updated dependencies [[`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8)]:
    - @wolfstar/env-utilities@2.0.8
    - @wolfstar/http-framework@3.2.1

## 1.2.9

### Patch Changes

- [#112](https://github.com/wolfstar-project/stars-components/pull/112) [`1ed856a`](https://github.com/wolfstar-project/stars-components/commit/1ed856a81eb18bdc2bc47e91ffd438e939cd7591) - fix(deps): update dependency @sentry/node to v10 Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`abf7f77`](https://github.com/wolfstar-project/stars-components/commit/abf7f77462ae91c9840a08e273899e4027f2253a)]:
    - @wolfstar/env-utilities@2.0.7
    - @wolfstar/http-framework@3.1.4

## 1.2.8

### Patch Changes

- [#107](https://github.com/wolfstar-project/stars-components/pull/107) [`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf) - Restore npm provenance attestation on publish for all packages Thanks [@RedStar071](https://github.com/RedStar071)!
- Updated dependencies [[`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf)]:
    - @wolfstar/env-utilities@2.0.5
    - @wolfstar/http-framework@3.1.2
    - @wolfstar/http-framework-i18n@1.2.5

## 1.2.7

### Patch Changes

- [#96](https://github.com/wolfstar-project/stars-components/pull/96) [`fda4e1d`](https://github.com/wolfstar-project/stars-components/commit/fda4e1d22edff4c516a599cec45294b1dfbde40b) - chore: migrate localization tooling from Crowdin to Tolgee Thanks [@RedStar071](https://github.com/RedStar071)!
- Updated dependencies [[`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5)]:
    - @wolfstar/env-utilities@2.0.4
    - @wolfstar/http-framework-i18n@1.2.4
    - @wolfstar/http-framework@3.1.1

## 1.2.6

### Patch Changes

- Updated dependencies [[`2d15b7d`](https://github.com/wolfstar-project/stars-components/commit/2d15b7d480b402a7334c01bb0116f0b73960ed8c)]:
    - @wolfstar/http-framework@3.0.0

## 1.2.5

### Patch Changes

- [#59](https://github.com/wolfstar-project/stars-components/pull/59) [`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db) - Add provenance attestation to publishConfig for all packages
- Updated dependencies [[`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db)]:
    - @wolfstar/env-utilities@2.0.3
    - @wolfstar/http-framework@2.3.1
    - @wolfstar/http-framework-i18n@1.2.3
