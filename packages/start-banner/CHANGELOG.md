# Changelog

## 2.1.0

### Minor Changes

- [#167](https://github.com/wolfstar-project/stars-components/pull/167) [`6836885`](https://github.com/wolfstar-project/stars-components/commit/6836885e5998f7af6d346fd30286ecede047389c) - feat: add a compact, replaceable default Stars banner

    `createStarsBanner()` uses a small built-in Stars logo, accepts a custom `logo` array as a replacement, and supports
    `logo: false` for text-only output. Newly scaffolded projects and the runnable examples use this helper instead of
    embedding the default artwork in every entry file. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.9

### Patch Changes

- [#151](https://github.com/wolfstar-project/stars-components/pull/151) [`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8) - build: replace tsc with golar as typechecker, bump typescript to 7.0.2

    `typecheck` scripts now run `golar tsc` instead of `tsc` directly. This is a dev-tooling-only change with no effect on published output. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.8

### Patch Changes

- [#126](https://github.com/wolfstar-project/stars-components/pull/126) [`abf7f77`](https://github.com/wolfstar-project/stars-components/commit/abf7f77462ae91c9840a08e273899e4027f2253a) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 2.0.7

### Patch Changes

- [#102](https://github.com/wolfstar-project/stars-components/pull/102) [`2d38bab`](https://github.com/wolfstar-project/stars-components/commit/2d38bab7745fb898809cd65de3337b9bcf42d976) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 2.0.6

### Patch Changes

- [#107](https://github.com/wolfstar-project/stars-components/pull/107) [`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf) - Restore npm provenance attestation on publish for all packages Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.5

### Patch Changes

- [#93](https://github.com/wolfstar-project/stars-components/pull/93) [`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5) - chore: upgrade tsdown to 0.22.14 and migrate `deps.skipNodeModulesBundle` to `deps.neverBundle` Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.4

### Patch Changes

- [#59](https://github.com/wolfstar-project/stars-components/pull/59) [`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db) - Add provenance attestation to publishConfig for all packages
