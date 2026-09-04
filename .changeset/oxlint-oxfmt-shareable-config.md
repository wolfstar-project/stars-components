---
'@wolfstar/eslint-plugin-http-framework': minor
'@wolfstar/oxlint-config': minor
'@wolfstar/oxfmt-config': minor
'@wolfstar/eslint-config': minor
'@wolfstar/prettier-config': minor
---

feat: add shareable oxlint/oxfmt/eslint/prettier configs and a custom wolfstar lint rules plugin

`@wolfstar/oxlint-config` and `@wolfstar/oxfmt-config` publish this repo's oxlint/oxfmt rules as reusable
base configs for other `@wolfstar/*` projects. `@wolfstar/eslint-config` and `@wolfstar/prettier-config` are
the same rules translated to ESLint/Prettier, for consumers who use those tools instead. Both lint configs
bundle `@wolfstar/eslint-plugin-http-framework`, a new custom rules plugin (ESLint-compatible, usable from
both ESLint and oxlint's JS plugin API) that catches `@wolfstar/http-framework` decorator misuse and
`@wolfstar/plugin-*` i18n pitfalls that TypeScript can't catch on its own.

None of this repo's own root lint/format configuration changes — it keeps linting/formatting with its
existing `.oxlintrc.json`/`.oxfmtrc.json` directly, unrelated to these shareable packages.
