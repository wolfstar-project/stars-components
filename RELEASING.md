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

This environment is referenced by the `republish` job in `.github/workflows/republish.yml`.

### 3. Configure secrets

Repository secrets (**Settings -> Secrets -> Actions**):

| Secret              | Description                                                                                                                                                                                                                                                                    |
| :------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WOLFSTAR_TOKEN`    | A GitHub PAT with `repo` and `workflow` scopes. Used by `changesets/action` to push commits and open PRs (the default `GITHUB_TOKEN` does not trigger other workflows).                                                                                                        |
| `NPM_PUBLISH_TOKEN` | An npm **granular access token** with type **Automation** (bypasses 2FA) and publish access to all `@wolfstar/*` packages. Required at **repository** level for `release.yml` and `republish.yml`. Classic publish tokens will fail with `ERR_PNPM_OTP_NON_INTERACTIVE` in CI. |

The manual **Republish** workflow (`republish.yml`) uses the `npm` environment for optional reviewer approval; you may mirror `NPM_PUBLISH_TOKEN` there as an environment secret if you use that gate.

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

Optional metadata in the changeset summary (parsed by `.changeset/generator.ts`):

- `pr: #123` — link the entry to a pull request
- `commit: abc1234` — link to a specific commit
- `author: @username` — credit a contributor in the changelog

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

If the automatic publish step in `release.yml` fails after the "Version Packages" PR is merged:

1. Fix the underlying issue (npm token, network, build failure, etc.).
2. Go to **Actions -> Republish -> Run workflow**.
3. Click **Run workflow** on `main`.
4. The job runs `pnpm release` (`pnpm build && changeset publish --provenance`). It is
   idempotent and skips packages already published at the current version.

Use this only when versions on `main` are already bumped and you need to retry npm publish
for the lockstep release. It does not create or update the "Version Packages" PR.

### Canary (`@next`) channel

The `snapshot` job in `release.yml` publishes all 13 packages under the dist-tag `next`
whenever `main` receives a push that changes `packages/`, root `package.json`, or
`pnpm-lock.yaml`. Version bumps use Changesets snapshots (for example `1.2.3-next.0`) via
`pnpm publish:snapshot`. Snapshot publish is skipped for `chore: version packages` merge
commits.

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
