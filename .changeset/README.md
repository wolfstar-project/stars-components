# Changesets

Every pull request that changes publishable package code must include a changeset file.

```sh
pnpm changeset
```

If a change does not need a release (docs, CI-only, etc.), run:

```sh
pnpm changeset add --empty
```

See [RELEASING.md](../RELEASING.md) for the full release workflow.
