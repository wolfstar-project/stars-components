# Releasing

Stars-components uses [`@changesets/cli`](https://github.com/changesets/changesets) for
monorepo releases. All 13 `@wolfstar/*` packages share a single semver (lockstep) and are
versioned and published together via a `fixed` group in `.changeset/config.json`.

---

## One-time setup (required before first release)

### 1. Allow GitHub Actions to create pull requests

Under **Settings -> Actions -> General -> Workflow permissions**, enable
**Allow GitHub Actions to create and approve pull requests**.

Without this, `changesets/action` fails when it attempts to open the "Version Packages" PR.

### 2. Create the `npm` GitHub environment

1. Go to **Settings -> Environments -> New environment**, name it exactly `npm`.
2. Optionally scope it to the `main` branch.
3. Optionally require a reviewer approval before the publish step runs.

This environment is referenced by the `publish` job in `.github/workflows/publish.yml`.

### 3. Configure secrets

Two secrets are required in **Settings -> Secrets -> Actions**:

| Secret              | Description                                                                                                                                                             |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WOLFSTAR_TOKEN`    | A GitHub PAT with `repo` and `workflow` scopes. Used by `changesets/action` to push commits and open PRs (the default `GITHUB_TOKEN` does not trigger other workflows). |
| `NPM_PUBLISH_TOKEN` | An npm token with `Automation` type and publish access to all `@wolfstar/*` packages.                                                                                   |

### 4. Install the autofix.ci GitHub App (optional)

`.github/workflows/autofix.yml` uses the [autofix.ci](https://autofix.ci) GitHub App to
push lint/format fixes back to PR branches. Install it at <https://github.com/apps/autofix-ci>.

---

## Development workflow: adding a changeset

Every PR that introduces a change worth releasing **must** include a changeset file.

```sh
pnpm changeset
```

The interactive CLI will ask:

1. Which packages are affected (any one is enough — `fixed` bumps all together)
2. Bump type: `patch` / `minor` / `major`
3. A short summary for the changelog

This creates a `.changeset/<random-slug>.md` file. Commit it alongside your code changes.

---

## Release runbook

### Cutting a stable release

1. Merge one or more PRs that include changeset files.
2. The `release` job in `release.yml` automatically creates or updates a
   **"Version Packages"** PR. This PR bumps all package versions and updates CHANGELOGs.
3. Review the PR and optionally edit the changelog entries.
4. Merge the PR. `changesets/action` publishes all 13 packages to npm automatically
   with provenance attestation.

All 13 packages are published together from the same version.

### Recovering a failed publish

If the automatic publish step in `release.yml` fails, use the manual workflow:

1. Go to **Actions -> Publish -> Run workflow**.
2. Click **Run workflow** on `main`.
3. The job runs `pnpm changeset publish --provenance` — it is idempotent and skips
   packages already published at the current version.

### Canary (`@next`) channel

Every push to `main` (except "Version Packages" merge commits) triggers `cd.yml`, which
publishes all 13 packages under the dist-tag `next` with version `X.Y.Z-next.<7-char-sha>`.

No manual action is needed. Consumers can install the latest canary via:

```sh
pnpm add @wolfstar/http-framework@next
```

---

## Version policy

- All 13 packages share a single semver (lockstep) enforced by the `fixed` group in
  `.changeset/config.json`.
- **Do not edit `package.json#version` by hand.** The "Version Packages" PR owns the bump.
- Bump type is set explicitly in each changeset file added during development:
    - `patch` — bug fixes, dependency updates
    - `minor` — new features (backwards compatible)
    - `major` — breaking changes
