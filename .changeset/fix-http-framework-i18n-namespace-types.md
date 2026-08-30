---
'@wolfstar/http-framework-i18n': patch
---

Fix `getT`, `getSupportedLanguageT`, and `getSupportedUserLanguageT` failing to type-check once a consumer augments
i18next's `CustomTypeOptions.resources` (e.g. via `@wolfstar/i18next-type-generator`): the generic namespace
parameter defaulted to i18next's `DefaultNamespace` (`"translation"`), which stops satisfying the narrowed
`Namespace` constraint as soon as any resources are declared. The default now resolves to `Namespace` itself.
