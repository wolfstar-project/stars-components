# Changelog

## 2.4.1

### Patch Changes

- [#167](https://github.com/wolfstar-project/stars-components/pull/167) [`6836885`](https://github.com/wolfstar-project/stars-components/commit/6836885e5998f7af6d346fd30286ecede047389c) - feat: add a compact, replaceable default Stars banner

    `createStarsBanner()` uses a small built-in Stars logo, accepts a custom `logo` array as a replacement, and supports
    `logo: false` for text-only output. Newly scaffolded projects and the runnable examples use this helper instead of
    embedding the default artwork in every entry file. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#169](https://github.com/wolfstar-project/stars-components/pull/169) [`f9bc134`](https://github.com/wolfstar-project/stars-components/commit/f9bc134f5161b4757fc254febf85df6bacb6a9f9) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 2.4.0

### Minor Changes

- [#164](https://github.com/wolfstar-project/stars-components/pull/164) [`05fca34`](https://github.com/wolfstar-project/stars-components/commit/05fca3434124f40a41f9af5dc4e6d083f570acc0) - feat: scaffold the build inside `stars.config`

    Generated TypeScript projects no longer ship a `tsdown.config.ts`: the build lives in `stars.config.ts` alongside
    everything else the `stars` CLI reads, and `future: { compatibilityVersion: 4 }` opts them into the next major's
    defaults — auto imports wired into the build, and `stars.config` as the only build configuration.

    The generated `tsconfig.json` includes `.stars/*.d.ts` so the auto imports are typed and declares the `paths` for the
    built-in `~`/`@`/`~~`/`@@` aliases, and the generated `.gitignore` covers `.stars/`. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.3.0

### Minor Changes

- [#158](https://github.com/wolfstar-project/stars-components/pull/158) [`f513392`](https://github.com/wolfstar-project/stars-components/commit/f51339281ad17ae83ef779a4fe97d4502551f59c) - feat: scaffold projects on top of the `stars` CLI

    Generated projects now depend on `@wolfstar/cli`, ship a `stars.config.ts` (or `stars.config.js`) file that imports
    `defineConfig` from `@wolfstar/http-framework/config`, and use `stars dev` / `stars build` as their `dev` and `build`
    scripts for every language and build tool, replacing the per-tool `watch`, `watch:start` and `tsc-watch` wiring. The
    `generate:i18n` script now runs `stars codegen`. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#159](https://github.com/wolfstar-project/stars-components/pull/159) [`214a6aa`](https://github.com/wolfstar-project/stars-components/commit/214a6aa40aa1925baa149924612c499d9bffba50) - Drop the generated `src/lib/setup/logger` module and the `@wolfstar/logger` dependency from scaffolded projects: `container.logger` is now provided by `@wolfstar/http-framework` out of the box. Thanks [@RedStar071](https://github.com/RedStar071)!

## 2.2.0

### Minor Changes

- [#150](https://github.com/wolfstar-project/stars-components/pull/150) [`cdf6bf9`](https://github.com/wolfstar-project/stars-components/commit/cdf6bf9b91cef1ed50f9a788449e26bcbed2b647) - feat: revamp the generated project template to match the monorepo's `examples/basic` reference
  (env/logger/banner setup, `@wolfstar/env-utilities` typed env augmentation), replace i18n
  scaffolding with `@wolfstar/plugin-i18next` (dropping the deprecated
  `@wolfstar/http-framework-i18n`), and add `--subcommands` / `--subcommands-advanced` / `--testing`
  toggles for a subcommand example command (flat, or with subcommand groups) and a vitest +
  `@wolfstar/http-framework-test-utils` testing setup.

    BREAKING (for scripted `--i18n --no-interactive` callers): the i18n toggle now installs and
    scaffolds against `@wolfstar/plugin-i18next` instead of the deprecated
    `@wolfstar/http-framework-i18n`. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#152](https://github.com/wolfstar-project/stars-components/pull/152) [`ce8f77a`](https://github.com/wolfstar-project/stars-components/commit/ce8f77a11a3eb825c77d021807827f400affa232) - fix: rerunning the generator with `--ignore` against an existing project (e.g. to toggle a feature
  or switch `--language`) now removes stale files left behind by the previous run — e.g.
  `src/commands/math.ts` after disabling `--subcommands`, or the previous language's `src/main.*`
  after switching `--language` — instead of leaving them with imports for packages `package.json` no
  longer declares. Hand-edited files are detected and left in place with a warning rather than being
  deleted. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#151](https://github.com/wolfstar-project/stars-components/pull/151) [`e32aea1`](https://github.com/wolfstar-project/stars-components/commit/e32aea17e3b2bd29fdfeacd4efe169ed901ff5c8) - build: replace tsc with golar as typechecker, bump typescript to 7.0.2

    `typecheck` scripts now run `golar tsc` instead of `tsc` directly. This is a dev-tooling-only change with no effect on published output. Thanks [@RedStar071](https://github.com/RedStar071)!

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
