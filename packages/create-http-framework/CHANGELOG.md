# Changelog

## 2.1.0

### Minor Changes

- [#73](https://github.com/wolfstar-project/stars-components/pull/73) [`028e842`](https://github.com/wolfstar-project/stars-components/commit/028e84269c7be8b01cdf1f31caeb3c48d0f1fe72) - Add interactive and CLI options for language (TS/JS), build tool, linter, and formatter when scaffolding new projects. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#75](https://github.com/wolfstar-project/stars-components/pull/75) [`5204d33`](https://github.com/wolfstar-project/stars-components/commit/5204d338fc16e9f7768730f613ba4f21d44de31a) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

- [#74](https://github.com/wolfstar-project/stars-components/pull/74) [`17f7e95`](https://github.com/wolfstar-project/stars-components/commit/17f7e9510cda542f29dcd1dc75d63b7b0d99c008) - Address scaffold review follow-ups: standardize non-interactive mode on `--no-interactive` (drop the `--yes` / `-y` alias) and update the README and `--help` output to match, make the generated tsdown `watch:start` script actually pass `--watch`, warn when `--build` is supplied alongside `--language js`, drop the redundant build-tool initializer, and omit the oxlint `typescript` plugin from `.oxlintrc.json` for JavaScript projects. Thanks [@blacksmith-sh](https://github.com/apps/blacksmith-sh)!

- [#72](https://github.com/wolfstar-project/stars-components/pull/72) [`dda5fa7`](https://github.com/wolfstar-project/stars-components/commit/dda5fa743162aab58582538438dd8d275b30b939) - Add package READMEs documenting installation, usage, and exports. A patch release publishes them to npm so both packages render proper documentation on their package pages. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.0.1

### Patch Changes

- [#59](https://github.com/wolfstar-project/stars-components/pull/59) [`b9be51e`](https://github.com/wolfstar-project/stars-components/commit/b9be51ef038beaa1169cf43e4507b1ad2f3ad9db) - Add provenance attestation to publishConfig for all packages

## 2.0.0

### Major Changes

- [#54](https://github.com/wolfstar-project/stars-components/pull/54) [`5f631d0`](https://github.com/wolfstar-project/stars-components/commit/5f631d045151b29f11915c88c81e893c5a0f37e7) - Improve CLI with Vite-inspired argument parsing (`--yes`, `--overwrite`, `--interactive`, `--help`), automatic AI agent detection via `@vercel/detect-agent`, parallel npm version fetching, and directory overwrite handling.
