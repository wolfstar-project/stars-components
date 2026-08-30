# Changelog

## 2.1.4

### Patch Changes

- [#126](https://github.com/wolfstar-project/stars-components/pull/126) [`abf7f77`](https://github.com/wolfstar-project/stars-components/commit/abf7f77462ae91c9840a08e273899e4027f2253a) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 2.1.3

### Patch Changes

- [#102](https://github.com/wolfstar-project/stars-components/pull/102) [`2d38bab`](https://github.com/wolfstar-project/stars-components/commit/2d38bab7745fb898809cd65de3337b9bcf42d976) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

- [#122](https://github.com/wolfstar-project/stars-components/pull/122) [`a1dc4e9`](https://github.com/wolfstar-project/stars-components/commit/a1dc4e9cfb8c2b8aa34d65223b8c82f800d47e2e) - Fixed scaffolded projects never loading their commands. `client.load()` locates the `commands` directory relative to `package.json`'s `main` field (falling back to the working directory when `main` is unset), not relative to the file that calls it — but the generated `package.json` had no `main` field, so `client.load()` resolved to the project root instead of `dist/commands` (or `src/commands` for the JavaScript template). Combined with the entry point previously passing `baseUserDirectory: join(dirname(fileURLToPath(import.meta.url)), 'commands')`, which doubled the `commands` segment, scaffolded bots never registered any commands.

    The generated `package.json` now sets `main` to the file the `start` script actually runs (`dist/index.js` for TypeScript, `src/index.js` for JavaScript), and the entry point calls `client.load()` with no arguments, matching the convention used by `examples/basic` and the production bots `staryl`/`ring`. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.1.2

### Patch Changes

- [#107](https://github.com/wolfstar-project/stars-components/pull/107) [`dd057a9`](https://github.com/wolfstar-project/stars-components/commit/dd057a9096cbbaa0d80a69de6b4f10a838cdfadf) - Restore npm provenance attestation on publish for all packages Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.1.1

### Patch Changes

- [#93](https://github.com/wolfstar-project/stars-components/pull/93) [`adce4cb`](https://github.com/wolfstar-project/stars-components/commit/adce4cb983e7f60d23bbd6d13f66adba4e2a08f5) - chore: upgrade tsdown to 0.22.14 and migrate `deps.skipNodeModulesBundle` to `deps.neverBundle` Thanks [@RedStar071](https://github.com/RedStar071)!

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
