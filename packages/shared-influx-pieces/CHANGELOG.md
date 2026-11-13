# Changelog

## 1.3.0

### Minor Changes

- [#375](https://github.com/wolfstar-project/stars-components/pull/375) [`097d648`](https://github.com/wolfstar-project/stars-components/commit/097d6480525cd5b8794598a8168af3b359bc481e) - The module sets `meta.configKey` to `influxPieces`, so the `influxPieces` key of `stars.config` belongs to it (no options yet) and is typed in `defineConfig` through a `StarsConfig` augmentation. `@wolfstar/schema` is a new optional peer, needed only for that type. Refs wolfstar-project/plugins#258. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`8ff3f45`](https://github.com/wolfstar-project/stars-components/commit/8ff3f450c853efd294ae7815ec4137cc6fe699db), [`f9af4de`](https://github.com/wolfstar-project/stars-components/commit/f9af4deb25a8ddd56339f91baef621d1ab1e192b), [`35240ae`](https://github.com/wolfstar-project/stars-components/commit/35240ae9c31f93dabe3898eee4a8740910109b3c), [`c553cfb`](https://github.com/wolfstar-project/stars-components/commit/c553cfba9cca7e29bdd72541958170ed9f82b9ec), [`a64551c`](https://github.com/wolfstar-project/stars-components/commit/a64551ce145c638e2bd3f7348c12d6cd115ce25d)]:
    - @wolfstar/http-framework@6.6.0

## 1.2.0

### Minor Changes

- [#341](https://github.com/wolfstar-project/stars-components/pull/341) [`f1969c0`](https://github.com/wolfstar-project/stars-components/commit/f1969c00b773ebc711b0bbaa5321f2cef6dd373f) - Add a `@wolfstar/shared-influx-pieces/module` entry, so the package can be listed in `modules` in `stars.config` instead of importing `/register`. It registers a `@wolfstar/shared-influx-pieces/plugin` plugin that creates `container.influx` when the credentials are set. `@wolfstar/kit` is an optional peer dependency. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#332](https://github.com/wolfstar-project/stars-components/pull/332) [`847fba8`](https://github.com/wolfstar-project/stars-components/commit/847fba8205c9622f04552c2e0dcbb5686e9cfd6f) - Raise the `@wolfstar/http-framework` range to `^6.4.0`. The packages already declare it as `workspace:^`, but `onlyUpdatePeerDependentsWhenOutOfRange` kept them from being republished after the framework's minor releases, so the ranges on npm were still `^6.0.0` (and `^6.3.0` for `@wolfstar/decorators`). Thanks [@RedStar071](https://github.com/RedStar071)!
- Updated dependencies [[`cda12c2`](https://github.com/wolfstar-project/stars-components/commit/cda12c27a2ccf313d78a84d55f9114228d0b1689)]:
    - @wolfstar/http-framework@6.5.0

## 1.1.10

### Patch Changes

- Updated dependencies [[`3aa572c`](https://github.com/wolfstar-project/stars-components/commit/3aa572c78006b3dffdba8ff804c781498fef6153)]:
    - @wolfstar/http-framework@6.0.0

## 1.1.9

### Patch Changes

- Updated dependencies [[`9b71e86`](https://github.com/wolfstar-project/stars-components/commit/9b71e86b2a53b6467991764efb2e2c211c4a4131), [`18eda16`](https://github.com/wolfstar-project/stars-components/commit/18eda168cd486c24913feddd83f132b4f84739bb)]:
    - @wolfstar/http-framework@5.0.0

## 1.1.8

### Patch Changes

- [#178](https://github.com/wolfstar-project/stars-components/pull/178) [`6d63859`](https://github.com/wolfstar-project/stars-components/commit/6d63859d5eede5367868daa8e9ab89a739407de1) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`6d63859`](https://github.com/wolfstar-project/stars-components/commit/6d63859d5eede5367868daa8e9ab89a739407de1)]:
    - @wolfstar/env-utilities@2.1.1
    - @wolfstar/http-framework@4.0.1
    - @wolfstar/influx-utilities@1.1.6

## 1.1.7

### Patch Changes

- Updated dependencies [[`93544d5`](https://github.com/wolfstar-project/stars-components/commit/93544d53776cb46aa3126996435388a80834335b), [`93544d5`](https://github.com/wolfstar-project/stars-components/commit/93544d53776cb46aa3126996435388a80834335b), [`93544d5`](https://github.com/wolfstar-project/stars-components/commit/93544d53776cb46aa3126996435388a80834335b)]:
    - @wolfstar/http-framework@4.0.0
    - @wolfstar/env-utilities@2.1.0

## 1.1.6

### Patch Changes

- [#151](https://github.com/wolfstar-project/stars-components/pull/151) [`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8) - build: replace tsc with golar as typechecker, bump typescript to 7.0.2

    `typecheck` scripts now run `golar tsc` instead of `tsc` directly. This is a dev-tooling-only change with no effect on published output. Thanks [@RedStar071](https://github.com/RedStar071)!

- Updated dependencies [[`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8)]:
    - @wolfstar/env-utilities@2.0.8
    - @wolfstar/http-framework@3.2.1
    - @wolfstar/influx-utilities@1.1.5

## 1.1.5

### Patch Changes

- [#107](https://github.com/wolfstar-project/stars-components/pull/107) [`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf) - Restore npm provenance attestation on publish for all packages Thanks [@RedStar071](https://github.com/RedStar071)!
- Updated dependencies [[`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf)]:
    - @wolfstar/env-utilities@2.0.5
    - @wolfstar/http-framework@3.1.2
    - @wolfstar/influx-utilities@1.1.4

## 1.1.4

### Patch Changes

- [#93](https://github.com/wolfstar-project/stars-components/pull/93) [`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5) - chore: upgrade tsdown to 0.22.14 and migrate `deps.skipNodeModulesBundle` to `deps.neverBundle` Thanks [@RedStar071](https://github.com/RedStar071)!
- Updated dependencies [[`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5)]:
    - @wolfstar/env-utilities@2.0.4
    - @wolfstar/http-framework@3.1.1
    - @wolfstar/influx-utilities@1.1.3

## 1.1.3

### Patch Changes

- Updated dependencies []:
    - @wolfstar/http-framework@3.0.0

## 1.1.2

### Patch Changes

- [#59](https://github.com/wolfstar-project/stars-components/pull/59) [`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db) - Add provenance attestation to publishConfig for all packages
- Updated dependencies [[`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db)]:
    - @wolfstar/env-utilities@2.0.3
    - @wolfstar/http-framework@2.3.1
    - @wolfstar/influx-utilities@1.1.2
