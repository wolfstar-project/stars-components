---
'@wolfstar/start-banner': minor
'@wolfstar/create-http-framework': patch
'basic': patch
'basic-js': patch
'with-i18n': patch
'with-i18n-js': patch
'with-subcommands': patch
'with-subcommands-js': patch
---

feat: add a compact, replaceable default Stars banner

`createStarsBanner()` uses a small built-in Stars logo, accepts a custom `logo` array as a replacement, and supports
`logo: false` for text-only output. Newly scaffolded projects and the runnable examples use this helper instead of
embedding the default artwork in every entry file.
