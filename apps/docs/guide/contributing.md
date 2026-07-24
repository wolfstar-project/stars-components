---
title: Contributing
description: Develop packages and documentation in the Stars Components monorepo.
---

# Contributing

Contributions should start from `main` and stay focused on utilities that are broadly useful to Star Network projects.

## Set up the repository

```bash
git clone https://github.com/wolfstar-project/stars-components.git
cd stars-components
corepack enable
pnpm install --frozen-lockfile
```

Node.js 24 matches CI, while packages support Node.js 20 and newer.

## Run the quality gates

Build before typechecking because cross-package type resolution uses generated declarations:

```bash
pnpm lint
pnpm build
pnpm typecheck
pnpm test
```

Package changes need a changeset:

```bash
pnpm changeset
```

Documentation-only changes can use an empty changeset.

## Work on the documentation

```bash
pnpm docs:dev
```

The docs command regenerates the API reference from all public package entry points and starts VitePress. Package guides
include the package README content, so edit `packages/<name>/README.md` when the same guidance should appear on npm.

Verify a production documentation build with:

```bash
pnpm docs:build
```

## Project guidelines

- Keep additions useful across projects rather than tied to one bot.
- Preserve sharding compatibility.
- Prefer behavior-oriented APIs with predictable state.
- Follow the repository's Oxlint and Oxfmt configuration.
- Add tests for behavior changes and update package documentation when public APIs change.

See the complete [contributing guide](https://github.com/wolfstar-project/stars-components/blob/main/.github/CONTRIBUTING.md)
before opening a pull request.
