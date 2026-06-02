# AGENTS.md

Project conventions discovered for `stars-components` (formerly `archid-components`).

## Stack

- **Language:** TypeScript (`~5.8.3`), Node `>=18`.
- **Package manager:** `pnpm@11.5.0` (corepack-pinned, workspaces via `pnpm-workspace.yaml`).
- **Monorepo runner:** `turbo` (`turbo run build|typecheck`).
- **Bundler:** `tsup` per package.
- **Tests:** `vitest` (workspace config at root).
- **Lint:** `oxlint` with `oxlint-tsgolint`.
- **Format:** `oxfmt`.
- **Release:** `danielroe/uppt` (lockstep monorepo OIDC staged publish).
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
- All 13 publishable packages share one lockstep semver. `uppt/pr` bumps every workspace together from the value in `packages/*/package.json#version`.
- Crowdin sync is configured at root (`crowdin.yml`) and only targets `packages/shared-http-pieces/src/locales/**`.

## Branding (target state after rebrand)

- **npm scope:** `@wolfstar`
- **GitHub org:** `wolfstar-project`
- **Repo name:** `stars-components` (already renamed locally; remote URLs must follow)
- **Primary domain:** `wolfstar.rocks` (subdomains: `join.`, `donate.`, `cdn.`, `influxdb.`, `contact@`)
- **CI secret:** `WOLFSTAR_TOKEN`
- **Influx org string:** `Wolfstar-Project`
- **CDN asset path:** `cdn.wolfstar.rocks/wolfstar-assets/...`

## Out of scope for the rebrand

- The product name "ArchId Network" in `package.json#description` and `README.md` heading (no instruction to change it; treat as separate decision).
- Crowdin `project_id` (`520232`) and per-project Crowdin badge slugs (`sharedhttppieces`) — these are external resources owned by the new org and require a manual Crowdin migration outside the codebase.

## Notes for agents

- Do NOT touch `pnpm-lock.yaml` manually; let `pnpm install` regenerate it after `package.json` edits.
- Do not edit `package.json#version` by hand; `uppt/pr` owns the bump. Manual hotfixes are done by re-running the `Release` workflow on a `v*` tag.
- Folder names under `packages/` do not contain `skyra`; only package `name`, `author`, scoped imports, and `keywords` need updating.
- CHANGELOGs are being reset (per user decision) — leave only a header.
