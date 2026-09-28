# Changelog

## 2.2.1

### Patch Changes

- [#227](https://github.com/wolfstar-project/stars-components/pull/227) [`ae15eef`](https://github.com/wolfstar-project/stars-components/commit/ae15eef45d0f85c630b8563b5436b9cd6379e64d) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

- [#226](https://github.com/wolfstar-project/stars-components/pull/226) [`3533b4d`](https://github.com/wolfstar-project/stars-components/commit/3533b4d15b15bb96954ca8ec1928b44c9f670ae9) - Fix `${VAR}` references between `.env*` files: `loadEnvFiles()` used to expand every file right after loading it, so a specific file (e.g. `.env.local`) referencing a variable defined only in a more generic one (e.g. `.env`) silently resolved to an empty string. All files are now parsed first and expanded once, so references resolve regardless of load order. Precedence (specific over generic, `src/.env*` over root, existing `process.env` values kept) and the `prefix` filter (applied after expansion) are unchanged.

    Because a variable is now resolved from the merged result and no longer from the file that defined it, a specific file whose value expands to an empty string (e.g. `K=${MISSING}`) now ends up as `''` in `process.env` instead of falling back to the value from a more generic file. Variables that are part of a circular reference spanning several variables now resolve to an empty string instead of hanging the process, including cycle shapes that previously terminated with a non-empty value (e.g. `A=${B}` / `B=${A:-fallback}`, or `A=${B:+alt}` / `B=${A}`). Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.2.0

### Minor Changes

- [#198](https://github.com/wolfstar-project/stars-components/pull/198) [`95a5fa1`](https://github.com/wolfstar-project/stars-components/commit/95a5fa1f42d8793dd6e8f1a4a8f6a75ac6e3cdb2) - feat: add experimental support for [varlock](https://varlock.dev) as an alternative to `dotenv`, opt-in via the `loader: 'varlock'` option (or the `DOTENV_LOADER` environment variable) Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.1.1

### Patch Changes

- [#178](https://github.com/wolfstar-project/stars-components/pull/178) [`6d63859`](https://github.com/wolfstar-project/stars-components/commit/6d63859d5eede5367868daa8e9ab89a739407de1) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 2.1.0

### Minor Changes

- [#182](https://github.com/wolfstar-project/stars-components/pull/182) [`93544d5`](https://github.com/wolfstar-project/stars-components/commit/93544d53776cb46aa3126996435388a80834335b) - Make the Stars workflow convention-first: compatibility version 4 is now the default, `stars dev` forces development mode, `src/locales` is copied and watched automatically, and environment files are discovered under both `src/` and the project root.

    The interactive dev UI now supports `t` to open or close a public quick tunnel without configuring `dev.tunnel`. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#182](https://github.com/wolfstar-project/stars-components/pull/182) [`93544d5`](https://github.com/wolfstar-project/stars-components/commit/93544d53776cb46aa3126996435388a80834335b) - Fix a broken build caused by an incomplete removal of `@wolfstar/logger` (undefined `Logger` reference left by [#187](https://github.com/wolfstar-project/stars-components/issues/187)). Use `container.logger` from `@sapphire/pieces` when available (populated by `@wolfstar/http-framework`), falling back to `console.debug` for standalone consumers, instead of the deprecated `@wolfstar/logger` package. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.8

### Patch Changes

- [#151](https://github.com/wolfstar-project/stars-components/pull/151) [`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8) - build: replace tsc with golar as typechecker, bump typescript to 7.0.2

    `typecheck` scripts now run `golar tsc` instead of `tsc` directly. This is a dev-tooling-only change with no effect on published output. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.7

### Patch Changes

- [#126](https://github.com/wolfstar-project/stars-components/pull/126) [`abf7f77`](https://github.com/wolfstar-project/stars-components/commit/abf7f77462ae91c9840a08e273899e4027f2253a) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 2.0.6

### Patch Changes

- [#102](https://github.com/wolfstar-project/stars-components/pull/102) [`2d38bab`](https://github.com/wolfstar-project/stars-components/commit/2d38bab7745fb898809cd65de3337b9bcf42d976) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 2.0.5

### Patch Changes

- [#107](https://github.com/wolfstar-project/stars-components/pull/107) [`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf) - Restore npm provenance attestation on publish for all packages Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.4

### Patch Changes

- [#93](https://github.com/wolfstar-project/stars-components/pull/93) [`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5) - chore: upgrade tsdown to 0.22.14 and migrate `deps.skipNodeModulesBundle` to `deps.neverBundle` Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.3

### Patch Changes

- [#59](https://github.com/wolfstar-project/stars-components/pull/59) [`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db) - Add provenance attestation to publishConfig for all packages
