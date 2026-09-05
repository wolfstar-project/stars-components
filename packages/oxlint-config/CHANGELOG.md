# @wolfstar/oxlint-config

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
