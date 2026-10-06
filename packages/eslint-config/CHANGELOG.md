# @wolfstar/eslint-config

## 0.1.3

### Patch Changes

- Updated dependencies [[`05a8443`](https://github.com/wolfstar-project/stars-components/commit/05a8443cf6ba64950c9e2fed5ebdd13c03b6cc06)]:
    - @wolfstar/eslint-plugin-http-framework@0.1.3

## 0.1.2

### Patch Changes

- [#227](https://github.com/wolfstar-project/stars-components/pull/227) [`ae15eef`](https://github.com/wolfstar-project/stars-components/commit/ae15eef45d0f85c630b8563b5436b9cd6379e64d) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`ae15eef`](https://github.com/wolfstar-project/stars-components/commit/ae15eef45d0f85c630b8563b5436b9cd6379e64d)]:
    - @wolfstar/eslint-plugin-http-framework@0.1.2

## 0.1.1

### Patch Changes

- [#178](https://github.com/wolfstar-project/stars-components/pull/178) [`6d63859`](https://github.com/wolfstar-project/stars-components/commit/6d63859d5eede5367868daa8e9ab89a739407de1) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`6d63859`](https://github.com/wolfstar-project/stars-components/commit/6d63859d5eede5367868daa8e9ab89a739407de1)]:
    - @wolfstar/eslint-plugin-http-framework@0.1.1

## 0.1.0

### Minor Changes

- [#160](https://github.com/wolfstar-project/stars-components/pull/160) [`9ae9647`](https://github.com/wolfstar-project/stars-components/commit/9ae9647806113aeb13a1b9974d34ddc3068e27e2) - feat: add shareable oxlint/oxfmt/eslint/prettier configs and a custom wolfstar lint rules plugin

    `@wolfstar/oxlint-config` and `@wolfstar/oxfmt-config` publish this repo's oxlint/oxfmt rules as reusable
    base configs for other `@wolfstar/*` projects. `@wolfstar/eslint-config` and `@wolfstar/prettier-config` are
    the same rules translated to ESLint/Prettier, for consumers who use those tools instead. Both lint configs
    bundle `@wolfstar/eslint-plugin-http-framework`, a new custom rules plugin (ESLint-compatible, usable from
    both ESLint and oxlint's JS plugin API) that catches `@wolfstar/http-framework` decorator misuse and
    `@wolfstar/plugin-*` i18n pitfalls that TypeScript can't catch on its own.

    None of this repo's own root lint/format configuration changes — it keeps linting/formatting with its
    existing `.oxlintrc.json`/`.oxfmtrc.json` directly, unrelated to these shareable packages. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`9ae9647`](https://github.com/wolfstar-project/stars-components/commit/9ae9647806113aeb13a1b9974d34ddc3068e27e2)]:
    - @wolfstar/eslint-plugin-http-framework@0.1.0
