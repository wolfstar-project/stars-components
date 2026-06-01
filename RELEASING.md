# Releasing

Stars-components uses [`danielroe/uppt`](https://github.com/danielroe/uppt) for lockstep
monorepo releases. All 13 `@wolfstar/*` packages share a single semver and are versioned,
tagged, and published together.

---

## One-time setup (required before first release)

### 1. Allow GitHub Actions to create pull requests

Under **Settings -> Actions -> General -> Workflow permissions**, enable
**Allow GitHub Actions to create and approve pull requests**.

Without this, `uppt/pr` fails with `403 Forbidden: GitHub Actions is not permitted to
create or approve pull requests` when it attempts to open the release PR.

### 2. Create the `npm` GitHub environment

1. Go to **Settings -> Environments -> New environment**, name it exactly `npm`.
2. Optionally scope it to tags matching `v*`.
3. Optionally require a reviewer approval before the publish step runs.

This environment is referenced by the `publish` job in `.github/workflows/release.yml`
and the `publish` job in `.github/workflows/cd.yml`.

### 3. Add npm Trusted Publisher entries

Each published package needs its own Trusted Publisher entry on npmjs.com.

For each `@wolfstar/<pkg>` below, visit
`https://npmjs.com/package/@wolfstar/<pkg>/access` and add **two** entries:

| Entry            | Workflow file                   | Environment |
| :--------------- | :------------------------------ | :---------- |
| Stable releases  | `.github/workflows/release.yml` | `npm`       |
| Canary (`@next`) | `.github/workflows/cd.yml`      | `npm`       |

Set the permission chip to **npm stage publish** on both entries.

Packages requiring entries (13 total):

- `@wolfstar/env-utilities`
- `@wolfstar/http-framework`
- `@wolfstar/http-framework-i18n`
- `@wolfstar/i18next-backend`
- `@wolfstar/influx-utilities`
- `@wolfstar/logger`
- `@wolfstar/reddit-helpers`
- `@wolfstar/safe-fetch`
- `@wolfstar/shared-http-pieces`
- `@wolfstar/shared-influx-pieces`
- `@wolfstar/start-banner`
- `@wolfstar/twitch-helpers`
- `@wolfstar/weather-helpers`

> Note: `npm stage publish` requires the package to already exist on npmjs.com.
> Publish a version manually once (`npm publish --access public`) from a local machine
> for any package that has never been published before, then set up the Trusted Publisher.

### 4. Install the autofix.ci GitHub App (optional)

`.github/workflows/autofix.yml` uses the [autofix.ci](https://autofix.ci) GitHub App to
push lint/format fixes back to PR branches. The App is free for open-source repositories.
Install it at <https://github.com/apps/autofix-ci>.

Without the App installed, the `autofix.ci` workflow can still commit fixes to same-repo
PRs via the `GITHUB_TOKEN` (the `contents: write` job permission is already granted).

---

## Release runbook

### Cutting a stable release

1. Merge a conventional commit to `main` (e.g. `feat: add something`, `fix: correct thing`).
2. The `pr` job in `release.yml` automatically creates or updates a draft
   `release/vX.Y.Z` PR with a changelog.
3. Review the PR and optionally edit the release notes above the `## Changelog` line.
4. Merge the PR. The `release` job tags the merge commit and dispatches the `pack` job.
5. The `pack` job builds the packages and uploads the tarballs as workflow artifacts.
6. The `publish` job stages the tarballs via OIDC (`npm stage publish`).
7. Log in to <https://npmjs.com>, go to each package's **Releases** tab, and approve
   the staged publish within 72 hours. 2FA is required to approve.

All 13 packages are published together from the same `vX.Y.Z` tag.

### Recovering a failed canary publish

`cd.yml` has no `workflow_dispatch` trigger; it only fires on push to `main`.

To trigger a new canary run:

1. Push a no-op commit to `main`:

    ```sh
    git commit --allow-empty -m "chore: retrigger canary"
    git push
    ```

    This produces a new commit SHA, so all 13 packages are published under a fresh
    `3.0.0-next.<new-sha>` version with no conflict.

2. Alternatively, re-run the failed workflow job via **Actions -> Continuous Delivery ->
   Re-run failed jobs**. This re-uses the original `github.sha`, so the version string
   is identical to the failed attempt. Packages that already published successfully will
   be skipped by npm (duplicate version upload is a harmless 409); packages that failed
   will retry.

### Recovering a failed stable publish

If the `publish` job fails or times out before staging:

1. Go to **Actions -> release -> Run workflow**.
2. Select the `vX.Y.Z` tag ref from the branch/tag dropdown.
3. Click **Run workflow**. The `pack` and `publish` jobs re-run from the same tag.

### Canary (`@next`) channel

Every push to `main` (except release merge commits) triggers `cd.yml`, which publishes
all 13 packages under the dist-tag `next` with version `3.0.0-next.<7-char-sha>`.

No manual action is needed. Consumers can install the latest canary via:

```sh
pnpm add @wolfstar/http-framework@next
```

---

## Version policy

- All 13 packages share a single semver (lockstep).
- The version source of truth is `packages/*/package.json#version`. Every package must
  have the same value; `uppt` enforces this and fails fast otherwise.
- **Do not edit `package.json#version` by hand.** The `uppt/pr` job owns the bump.
- Bump type is derived from conventional commits since the last `vX.Y.Z` tag:
    - `feat: ...` -> minor bump
    - `fix: ...` / `perf: ...` -> patch bump
    - `feat!: ...` or `BREAKING CHANGE:` footer -> major bump
