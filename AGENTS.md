# AGENTS.md

Project conventions discovered for `stars-components` (formerly `archid-components`).

## Stack

- **Language:** TypeScript (`~5.8.3`), Node `^22.11 || ^24 || >=26` (the range required by Changesets v3; published packages still declare `>=20`).
- **Package manager:** `pnpm` (corepack-pinned via `packageManager` in root `package.json`; Renovate bumps the patch version often — check that file for the exact pin, don't hardcode it here). Workspaces via `pnpm-workspace.yaml`.
- **Monorepo runner:** `turbo` (`turbo run build|typecheck`).
- **Bundler:** `tsdown` per package.
- **Tests:** `vitest` (workspace config at root).
- **Lint:** `oxlint` with `oxlint-tsgolint`.
- **Format:** `oxfmt`.
- **Release:** [Changesets](https://github.com/changesets/changesets) v3 (`@changesets/cli` + `changesets/action` in CI, see `.github/workflows/release.yml`). Packages version independently, not in lockstep (`.changeset/config.json` has `fixed: []`, `linked: []`); `updateInternalDependencies: patch` bumps workspace dependents. Publishes use npm provenance (OIDC, `id-token: write`).
  v3 specifics that the config relies on: `format: "oxfmt"` (v3 replaced the `prettier` option with `format`, and generated changelogs must satisfy `oxfmt --check`), and `privatePackages: { version: true, tag: false }` (v3 stopped versioning private packages by default — this keeps the `examples/*` apps versioned as before).
- **Deprecation:** `@favware/npm-deprecate` (driven by `.npm-deprecaterc.yml`).

## Quality gates (in order)

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`

## Conventions

- Commits: Conventional Commits (`@commitlint/config-conventional`); `cz-conventional-changelog` via commitizen.
- File paths in CI use the npm scope as `--filter @<scope>/<package>` for turbo.
- Each package declares: `name`, `author` (scope handle), `repository.url`, `bugs.url`, `homepage`, `keywords`.
- 15 publishable `@wolfstar/*` packages under `packages/`, each with its own independent semver — there is no lockstep version. Merging a changeset (`pnpm changeset`) to `main` makes `changesets/action` (pinned v2, see `.github/workflows/release.yml`) open/update a `chore: update changelog and release` PR; merging that PR bumps the affected packages' versions, regenerates their CHANGELOGs (via `.changeset/generator.ts`), and publishes to npm. Any other push to `main` touching `packages/` or `package.json` also publishes an `@next` snapshot (`pnpm publish:snapshot` → `scripts/publish-snapshot.mjs`, which skips the publish when there are no pending changesets because `changeset version` exits `1` in that case since v3).
- `pkg.pr.new` continuous preview releases (`.github/workflows/pkg-pr-new.yml`): every PR, push to `main`, and manual dispatch builds and runs `pnpm exec pkg-pr-new publish --pnpm './packages/*'` (read-only `contents` permission, no npm publish) so a PR's package versions can be installed for testing before a Changesets release.
- Tolgee sync is configured at root (`.tolgeerc.cjs`) and only targets `packages/shared-http-pieces/src/locales/**`.
  Scripts: `pnpm tolgee:push` (base `en`), `pnpm tolgee:pull` (pull + remap), `pnpm tolgee:ensure-languages`.
  Discord locale folders (en-US, es-ES, …) map to shorter Tolgee tags (en, es, …); see `LOCALE_MAP` in `.tolgeerc.cjs`.
  Project **Shared HTTP Pieces** (`33773`) has Tolgee namespaces disabled — keys live in the default namespace and remap into `commands/shared.json`.

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

- This repo is a **library monorepo** (15 publishable `@wolfstar/*` packages, see `packages/`). There is no app/server/GUI to run; "running" the product means exercising packages via the quality gates and/or importing built `dist/` outputs.
- Dependencies are pre-installed by the startup update script (`pnpm install --frozen-lockfile`). Standard commands live in root `package.json`: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- **Run `pnpm build` before `pnpm typecheck`.** `typecheck` resolves cross-package imports (e.g. `@wolfstar/env-utilities`) against each package's built `dist/*.d.ts`; without a prior build, `tsc` fails with `TS2307: Cannot find module`. CI's "Build & Typecheck" job runs build then typecheck for this reason.
- Node: CI and `mise.toml` pin Node 24; root `engines` require `^22.11 || ^24 || >=26`. The VM's default Node (v22.x via `/exec-daemon/node`) satisfies that and works for all gates. `pnpm` is provided via corepack, pinned by the `packageManager` field in root `package.json` (check that file for the current exact version; Renovate bumps it often).
