---
'@wolfstar/i18next-type-generator': minor
'@wolfstar/http-framework-i18n': major
'@wolfstar/shared-http-pieces': major
---

feat: adopt i18next v25 native TypeScript types

`@wolfstar/http-framework-i18n` now targets i18next v25 with namespace-aware `getT` / `getSupportedLanguageT` helpers and drops the deprecated `T`, `FT`, `resolveKey`, and `resolveUserKey` APIs. `@wolfstar/shared-http-pieces` removes the hand-maintained `LanguageKeys` export in favour of the generated `CustomTypeOptions` augmentation and direct `TFunction<'commands/shared'>` usage. Adds `@wolfstar/i18next-type-generator`, the CLI used to generate that augmentation from locale JSON files.
