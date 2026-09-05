# @wolfstar/i18next-type-generator

## 3.1.1

### Patch Changes

- [#163](https://github.com/wolfstar-project/stars-components/pull/163) [`a697108`](https://github.com/wolfstar-project/stars-components/commit/a697108cb52dd123366d4288d91957458ab90401) - Enable npm provenance for published releases (`publishConfig.provenance`), matching every other package in this workspace. Thanks [@RedStar071](https://github.com/RedStar071)!

## 3.1.0

### Minor Changes

- [#30](https://github.com/wolfstar-project/stars-components/pull/30) [`170156a`](https://github.com/wolfstar-project/stars-components/commit/170156aed32c73c4b2d355e727f1136df7cfac55) - feat: adopt i18next v25 native TypeScript types

    `@wolfstar/http-framework-i18n` now targets i18next v25 with namespace-aware `getT` / `getSupportedLanguageT` helpers and drops the deprecated `T`, `FT`, `resolveKey`, and `resolveUserKey` APIs. `@wolfstar/shared-http-pieces` removes the hand-maintained `LanguageKeys` export in favour of the generated `CustomTypeOptions` augmentation and direct `TFunction<'commands/shared'>` usage. Adds `@wolfstar/i18next-type-generator`, the CLI used to generate that augmentation from locale JSON files. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#151](https://github.com/wolfstar-project/stars-components/pull/151) [`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8) - build: replace tsc with golar as typechecker, bump typescript to 7.0.2

    `typecheck` scripts now run `golar tsc` instead of `tsc` directly. This is a dev-tooling-only change with no effect on published output. Thanks [@RedStar071](https://github.com/RedStar071)!
