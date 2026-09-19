# AGENTS.md

Project conventions discovered for `stars-components` (formerly `archid-components`).

## Stack

- **Language:** TypeScript (`~7.0.2` in every package/example; the root `package.json` devDependency is still pinned to `~5.8.3`), Node `^22.11 || ^24 || >=26` (the range required by Changesets v3; published packages still declare `>=20`).
- **Package manager:** `pnpm` (corepack-pinned via `packageManager` in root `package.json`; Renovate bumps the patch version often — check that file for the exact pin, don't hardcode it here). Workspaces via `pnpm-workspace.yaml`.
- **Monorepo runner:** `turbo` (`turbo run build|typecheck`).
- **Bundler:** `tsdown` per package.
- **Typecheck:** `golar tsc` (each package/example has its own `golar.config.ts`, and a root one too) — `typecheck` scripts run `golar tsc -p ../../tsconfig.json` instead of bare `tsc`; `dev.typecheck.checker: 'auto'` in `stars.config` also picks `golar` whenever the project depends on it, `tsc` otherwise.
- **Tests:** `vitest` (workspace config at root).
- **Lint:** `oxlint` with `oxlint-tsgolint`.
- **Format:** `oxfmt`.
- **Release:** [Changesets](https://github.com/changesets/changesets) v3 (`@changesets/cli` + `changesets/action` in CI, see `.github/workflows/release.yml`). Packages version independently, not in lockstep (`.changeset/config.json` has `fixed: []`, `linked: []`); `updateInternalDependencies: patch` bumps workspace dependents. Publishes authenticate via npm trusted publishing (OIDC, `id-token: write`), which also generates provenance attestations automatically — no npm token secret, see `.changeset/README.md` for the required per-package npmjs.com setup.
  v3 specifics that the config relies on: `format: "oxfmt"` (v3 replaced the `prettier` option with `format`, and generated changelogs must satisfy `oxfmt --check`), and `privatePackages: { version: true, tag: false }` (v3 stopped versioning private packages by default — this keeps the `examples/*` apps versioned as before).
- **Deprecation:** `@favware/npm-deprecate` (driven by `.npm-deprecaterc.yml`).

## Quality gates (in order)

1. `pnpm lint`
2. `pnpm build`
3. `pnpm typecheck` (resolves cross-package imports against built `dist/*.d.ts`, so it needs `pnpm build` first)
4. `pnpm test`

## Conventions

- Commits: Conventional Commits (`@commitlint/config-conventional`); `cz-conventional-changelog` via commitizen.
- File paths in CI use the npm scope as `--filter @<scope>/<package>` for turbo.
- Each package declares: `name`, `author` (scope handle), `repository.url`, `bugs.url`, `homepage`, `keywords`.
- 25 publishable `@wolfstar/*` packages under `packages/`, each with its own independent semver — there is no lockstep version. Merging a changeset (`pnpm changeset`) to `main` makes `changesets/action` (pinned v2, see `.github/workflows/release.yml`) open/update a `chore: update changelog and release` PR; merging that PR bumps the affected packages' versions, regenerates their CHANGELOGs (via `.changeset/generator.ts`), and publishes to npm. Any other push to `main` touching `packages/` or `package.json` also publishes an `@next` snapshot (`pnpm publish:snapshot` → `scripts/publish-snapshot.mjs`, which skips the publish when there are no pending changesets because `changeset version` exits `1` in that case since v3).
- `pkg.pr.new` continuous preview releases (`.github/workflows/pkg-pr-new.yml`): every PR, push to `main`, and manual dispatch builds and runs `pnpm exec pkg-pr-new publish --pnpm './packages/*'` (read-only `contents` permission, no npm publish) so a PR's package versions can be installed for testing before a Changesets release.
- `@wolfstar/cli` (the `stars` binary — `dev`/`build`/`info`/`codegen`/`prepare`/`commands`) is a publishable package under `packages/cli`. The `stars.config` schema and loader (`defineConfig`/`loadStarsConfig`) live in their own package, `@wolfstar/schema` (`packages/schema`), which `@wolfstar/http-framework` re-exports unchanged as `@wolfstar/http-framework/config`; both `@wolfstar/cli` and `@wolfstar/http-framework` depend on `@wolfstar/schema`, not on each other's `/config` export, so any tool can resolve a project's configuration without pulling in either. `@wolfstar/http-framework` itself depends on `@wolfstar/cli` and exposes a `stars` bin (`bin/stars.mjs`, re-exporting `@wolfstar/cli/cli`) the way `nuxt` exposes `nuxi`'s binary — `@wolfstar/cli` has no install-time dependency on `@wolfstar/http-framework` in return (the same way `@nuxt/cli` has none on `nuxt`): its one runtime touch point, `@wolfstar/http-framework/auto-imports`, is resolved dynamically from the target project at `packages/cli/src/utils/framework-auto-imports.ts` instead of being declared as a dependency, which is what keeps the two packages from depending on each other. See `## The stars CLI configuration` below.
- Shareable tooling configs, extracted from this repo's own root config and published for external `@wolfstar/*` consumers: `@wolfstar/oxlint-config`, `@wolfstar/oxfmt-config`, `@wolfstar/eslint-config`, `@wolfstar/prettier-config`, and `@wolfstar/eslint-plugin-http-framework` (custom oxlint/ESLint rules for `@wolfstar/http-framework` and `@wolfstar/plugin-*` consumers, namespaced `wolfstar/*`). This repo's own root `.oxlintrc.json`/`.oxfmtrc.json` are the source these were extracted from, not consumers of them — the root config is not migrated to `extends`/depend on the published packages.
- i18n: `@wolfstar/plugin-i18next` (external, published from `wolfstar-project/plugins`) is the standard `@wolfstar/http-framework` i18n plugin — `@wolfstar/shared-http-pieces` consumes it directly. `@wolfstar/http-framework-i18n` is deprecated in favour of it (npm description carries a `DEPRECATED:` prefix, README has a `## Migration` section, and it's dropped from `.npm-deprecaterc.yml` so no further `@next` snapshots publish); `@wolfstar/i18next-backend` remains published as `http-framework-i18n`'s backend dependency. `@wolfstar/i18next-type-generator` is a CLI (`i18next-type-generator <locales-dir> <output.d.ts>`) that generates the i18next `CustomTypeOptions` augmentation from locale JSON, replacing hand-maintained `LanguageKeys`/`T`/`FT` helpers; consuming packages wire it up via a `generate:i18n` script (see `packages/shared-http-pieces/package.json`).
- Logging: `@wolfstar/http-framework` now has a built-in logger (`container.logger`), so `@wolfstar/logger` is deprecated the same way `@wolfstar/http-framework-i18n` was — npm description prefixed `DEPRECATED:`, README carries a migration warning, dropped from `.npm-deprecaterc.yml` — in favour of a future `@wolfstar/plugin-logger` (not published yet, only proposed).
- Tolgee sync is configured at root (`.tolgeerc.cjs`) and only targets `packages/shared-http-pieces/src/locales/**`.
  Scripts: `pnpm tolgee:push` (base `en`), `pnpm tolgee:pull` (pull + remap), `pnpm tolgee:ensure-languages`.
  Discord locale folders (en-US, es-ES, …) map to shorter Tolgee tags (en, es, …); see `LOCALE_MAP` in `.tolgeerc.cjs`.
  Project **Shared HTTP Pieces** (`33773`) has Tolgee namespaces disabled — keys live in the default namespace and remap into `commands/shared.json`.

## The `stars` CLI configuration

- A project's build lives in `stars.config.*`, not in a separate `tsdown.config.ts`: `tsdown: {}` (and `vite: {}` for
  `build.tool: 'vite'`) is merged into what the CLI derives from `entry`/`build`. The packages of this repository are
  libraries and keep their own `tsdown.config.ts` — this is about the bot projects the CLI builds.
- `future: { compatibilityVersion: 3 | 4 }` mirrors Nuxt's own: `4` is the default as of the convention-first rework
  (#182, `@wolfstar/http-framework` major) — `tsdown` configured from `stars.config` alone, auto imports on and wired
  in, `'auto'` picking `tsdown` for TypeScript entries. `3` is legacy behaviour (a `tsdown.config.*` drives the build,
  auto imports off unless asked for) and was kept as an opt-in rather than dropped: `LEGACY_COMPATIBILITY_VERSION` (3)
  stays in `COMPATIBILITY_VERSIONS` alongside `LATEST_COMPATIBILITY_VERSION`/`DEFAULT_COMPATIBILITY_VERSION` (4) in
  `packages/schema/src/config/resolve.ts`, and the `build.configFile` branch (compatibility version 3's
  file mode) stays in `TsdownBuilder` and its test.
- Convention-first defaults (#182) beyond the compatibility version: `stars dev` forces `NODE_ENV=development` for
  config evaluation, build plugins, and the supervised process; `src/locales` is copied to the build output and kept
  in sync by a `chokidar` watcher (`packages/cli/src/utils/locales.ts`) instead of a hand-written `tsdown` plugin; and
  `@wolfstar/env-utilities`' `setup()` (aliased `envRun` in scaffolded `src/lib/setup/all.ts`) takes no argument,
  discovering `.env*` files under both `src/` and the project root itself. `@wolfstar/create-http-framework` now
  scaffolds a bare `defineConfig({})` (or `{ build: { tool: 'tsc' } }` for a `tsc` project) instead of specifying
  `entry`/`build`/`future`.

## Branding (target state after rebrand)

- **npm scope:** `@wolfstar`
- **GitHub org:** `wolfstar-project`
- **Repo name:** `stars-components` (already renamed locally; remote URLs must follow)
- **Primary domain:** `wolfstar.rocks` (subdomains: `join.`, `donate.`, `cdn.`, `influxdb.`, `contact@`)
- **CI secret:** `WOLFSTAR_TOKEN`
- **Influx org string:** `Wolfstar-Project`
- **CDN asset path:** `cdn.wolfstar.rocks/wolfstar-assets/...`

## Out of scope for the rebrand

- Per-project Tolgee badge slugs on Crowdin-era READMEs are replaced by a generic Tolgee badge.
  The Tolgee project is **Shared HTTP Pieces** (`projectId` `33773` in `.tolgeerc.cjs`).

## Notes for agents

- Do NOT touch `pnpm-lock.yaml` manually; let `pnpm install` regenerate it after `package.json` edits.
- Do not edit `package.json#version` or a package's `CHANGELOG.md` by hand; both are owned by Changesets. Add a changeset via `pnpm changeset` for any user-facing change instead. Manual/hotfix publishes are done by re-running the `Release` workflow via `workflow_dispatch`.
- Folder names under `packages/` do not contain `skyra`; only package `name`, `author`, scoped imports, and `keywords` need updating.
- The docs site was moved out of this repo to `wolfstar-project/website`; don't reintroduce a docs app or `netlify.toml` here.
- `pnpm lint` / `pnpm lint:fix` run `oxlint`/`oxfmt` across both `packages` and `examples`; keep the runnable example apps under `examples/*` lint-clean too.

## Cursor Cloud specific instructions

- This repo is a **library monorepo** (25 publishable `@wolfstar/*` packages, see `packages/`). There is no app/server/GUI to run; "running" the product means exercising packages via the quality gates and/or importing built `dist/` outputs.
- Dependencies are pre-installed by the startup update script (`pnpm install --frozen-lockfile`). Standard commands live in root `package.json`: `pnpm lint`, `pnpm build`, `pnpm typecheck`, `pnpm test`.
- **Run `pnpm build` before `pnpm typecheck`.** `typecheck` resolves cross-package imports (e.g. `@wolfstar/env-utilities`) against each package's built `dist/*.d.ts`; without a prior build, `golar tsc` fails with `TS2307: Cannot find module`. CI's "Build & Typecheck" job runs build then typecheck for this reason.
- Node: CI and `mise.toml` pin Node 24; root `engines` require `^22.11 || ^24 || >=26`. The VM's default Node (v22.x via `/exec-daemon/node`) satisfies that and works for all gates. `pnpm` is provided via corepack, pinned by the `packageManager` field in root `package.json` (check that file for the current exact version; Renovate bumps it often).

## Server integration packages

- `@wolfstar/vite-server` and `@wolfstar/nitro-server` own the optional Vite/Nitro builders. They depend on the
  shared `Builder`/`BuilderContext` contract in `@wolfstar/schema`, never on `@wolfstar/cli` or the framework.
- The CLI's builder adapters supply project-relative loading and plugin registration. Keep optional integrations
  lazy-loaded by the builder factory; Vite and Nitro themselves are resolved from the consuming project.
- CLI integration tests alias both packages to source so CI can run tests before a build.
