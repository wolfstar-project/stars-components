<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

**A comprehensive collection of shared utilities and components powering the Star Network**

[![GitHub License](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)
[![Greptile: The War on Bugs](https://www.greptile.com/badge.svg)](https://www.greptile.com/?utm_source=oss_badge&utm_medium=readme&utm_campaign=greptile_for_open_source)
[![codecov](https://codecov.io/gh/wolfstar-project/stars-components/branch/main/graph/badge.svg?token=CJP65GQC8K&style=flat-square)](https://codecov.io/gh/wolfstar-project/stars-components)

</div>

---

## Overview

Stars Components is a monorepo containing **16 publishable TypeScript packages** under the `@wolfstar` npm scope. These packages provide foundational utilities and frameworks for building HTTP-only Discord bots and related services within the Star Network ecosystem.

**Technology Stack:**

- **Language:** TypeScript (Node.js `^22.11 || ^24 || >=26`)
- **Package Manager:** pnpm with workspaces
- **Monorepo Runner:** Turbo
- **Testing:** Vitest
- **Linting:** oxlint with oxfmt
- **Release:** Changesets v3 (independent semver per package)

---

## Quick Start

### Prerequisites

- Node.js `^22.11`, `^24`, or `>=26`
- pnpm (automatically pinned via corepack)

### Installation

```bash
# Clone the repository
git clone https://github.com/wolfstar-project/stars-components.git
cd stars-components

# Install dependencies (uses pnpm workspaces)
pnpm install

# Run quality gates in order
pnpm lint      # oxlint + oxfmt check
pnpm typecheck # TypeScript check (requires pnpm build first)
pnpm test      # vitest
pnpm build     # tsdown for each package
```

**Important:** Run `pnpm build` before `pnpm typecheck`, as typecheck resolves cross-package imports against built `dist/*.d.ts` files.

### Using a Package

Each package is independently published to npm under `@wolfstar/` scope. Install any package directly:

```bash
# Example: Install the HTTP framework and environment utilities
npm install @wolfstar/http-framework @wolfstar/env-utilities
# or with pnpm
pnpm add @wolfstar/http-framework @wolfstar/env-utilities
```

---

## Packages

| Package                                                                             | Description                                                                                                         | Version                                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core Framework**                                                                  |                                                                                                                     |                                                                                                                                                                   |
| [`@wolfstar/http-framework`](./packages/http-framework)                             | The primary framework for Star Network's HTTP-only Discord bots                                                     | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/http-framework)](https://npmx.dev/package/@wolfstar/http-framework)                             |
| **Framework Extensions**                                                            |                                                                                                                     |                                                                                                                                                                   |
| [`@wolfstar/http-framework-test-utils`](./packages/http-framework-test-utils)       | Test utilities and helpers for @wolfstar/http-framework                                                             | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/http-framework-test-utils)](https://npmx.dev/package/@wolfstar/http-framework-test-utils)       |
| [`@wolfstar/http-framework-i18n`](./packages/http-framework-i18n)                   | **DEPRECATED:** Use @wolfstar/plugin-i18next instead. Legacy i18n layer for HTTP framework                          | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/http-framework-i18n)](https://npmx.dev/package/@wolfstar/http-framework-i18n)                   |
| **Shared HTTP Services**                                                            |                                                                                                                     |                                                                                                                                                                   |
| [`@wolfstar/shared-http-pieces`](./packages/shared-http-pieces)                     | Common pieces and utilities for Star Network's HTTP-only bots                                                       | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/shared-http-pieces)](https://npmx.dev/package/@wolfstar/shared-http-pieces)                     |
| [`@wolfstar/shared-influx-pieces`](./packages/shared-influx-pieces)                 | InfluxDB integration pieces for Star Network's HTTP bots                                                            | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/shared-influx-pieces)](https://npmx.dev/package/@wolfstar/shared-influx-pieces)                 |
| **Internationalization (i18n)**                                                     |                                                                                                                     |                                                                                                                                                                   |
| [`@wolfstar/i18next-backend`](./packages/i18next-backend)                           | Fast filesystem-based i18next backend for Node.js                                                                   | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/i18next-backend)](https://npmx.dev/package/@wolfstar/i18next-backend)                           |
| [`@wolfstar/i18next-type-generator`](./packages/i18next-type-generator)             | CLI utility to generate TypeScript augmentations for i18next                                                        | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/i18next-type-generator)](https://npmx.dev/package/@wolfstar/i18next-type-generator)             |
| **Utilities & Helpers**                                                             |                                                                                                                     |                                                                                                                                                                   |
| [`@wolfstar/env-utilities`](./packages/env-utilities)                               | Functional utilities for reading and parsing environment variables                                                  | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/env-utilities)](https://npmx.dev/package/@wolfstar/env-utilities)                               |
| [`@wolfstar/influx-utilities`](./packages/influx-utilities)                         | Opinionated abstraction layer for InfluxDB single-organization access                                               | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/influx-utilities)](https://npmx.dev/package/@wolfstar/influx-utilities)                         |
| [`@wolfstar/logger`](./packages/logger)                                             | Lightweight logger system with level-based filtering                                                                | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/logger)](https://npmx.dev/package/@wolfstar/logger)                                             |
| [`@wolfstar/safe-fetch`](./packages/safe-fetch)                                     | Fetch wrapper implementing Rust-style Result types for error handling                                               | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/safe-fetch)](https://npmx.dev/package/@wolfstar/safe-fetch)                                     |
| [`@wolfstar/start-banner`](./packages/start-banner)                                 | CLI banner generator utility for startup messages                                                                   | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/start-banner)](https://npmx.dev/package/@wolfstar/start-banner)                                 |
| **Third-Party Integrations**                                                        |                                                                                                                     |                                                                                                                                                                   |
| [`@wolfstar/reddit-helpers`](./packages/reddit-helpers)                             | Reddit helper functions for Star Network bots                                                                       | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/reddit-helpers)](https://npmx.dev/package/@wolfstar/reddit-helpers)                             |
| [`@wolfstar/twitch-helpers`](./packages/twitch-helpers)                             | Twitch helper functions for Star Network bots                                                                       | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/twitch-helpers)](https://npmx.dev/package/@wolfstar/twitch-helpers)                             |
| [`@wolfstar/weather-helpers`](./packages/weather-helpers)                           | Weather API helper functions for Star Network bots                                                                  | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/weather-helpers)](https://npmx.dev/package/@wolfstar/weather-helpers)                           |
| **Project Scaffolding**                                                             |                                                                                                                     |                                                                                                                                                                   |
| [`@wolfstar/cli`](./packages/cli)                                                   | The `stars` CLI: typed `stars.config.ts`, `dev` with TUI, `build`, `info` and `codegen` for http-framework projects | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/cli)](https://npmx.dev/package/@wolfstar/cli)                                                   |
| [`@wolfstar/create-http-framework`](./packages/create-http-framework)               | CLI scaffolding tool to create new HTTP Framework bot projects                                                      | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/create-http-framework)](https://npmx.dev/package/@wolfstar/create-http-framework)               |
| **Tooling**                                                                         |                                                                                                                     |                                                                                                                                                                   |
| [`@wolfstar/oxlint-config`](./packages/oxlint-config)                               | Shareable oxlint base configuration                                                                                 | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/oxlint-config)](https://npmx.dev/package/@wolfstar/oxlint-config)                               |
| [`@wolfstar/oxfmt-config`](./packages/oxfmt-config)                                 | Shareable oxfmt base configuration                                                                                  | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/oxfmt-config)](https://npmx.dev/package/@wolfstar/oxfmt-config)                                 |
| [`@wolfstar/eslint-config`](./packages/eslint-config)                               | Shareable ESLint flat configuration, for consumers who use ESLint instead of oxlint                                 | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/eslint-config)](https://npmx.dev/package/@wolfstar/eslint-config)                               |
| [`@wolfstar/prettier-config`](./packages/prettier-config)                           | Shareable Prettier configuration, for consumers who use Prettier instead of oxfmt                                   | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/prettier-config)](https://npmx.dev/package/@wolfstar/prettier-config)                           |
| [`@wolfstar/eslint-plugin-http-framework`](./packages/eslint-plugin-http-framework) | Custom lint rules for `@wolfstar/http-framework` and the `@wolfstar/plugin-*` ecosystem, for ESLint and oxlint      | [![version](https://npmx.dev/api/registry/badge/version/@wolfstar/eslint-plugin-http-framework)](https://npmx.dev/package/@wolfstar/eslint-plugin-http-framework) |

---

## Examples

The [`examples/`](./examples) directory contains runnable bot samples using the HTTP Framework and related utilities. Examples are provided in both TypeScript and JavaScript (ESM).

### Running an Example

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Setup environment for the basic example
cp examples/basic/.env.example examples/basic/src/.env

# Run a TypeScript example (with live reloading)
pnpm --filter basic dev

# Or run a plain JavaScript example (no build step)
pnpm --filter basic-js dev
```

For a complete list of available examples, see [`examples/README.md`](./examples/README.md).

---

## Development

### Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/wolfstar-project/.github/blob/main/.github/CONTRIBUTING.md) before submitting a pull request.

**Key Conventions:**

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) using `cz` (commitizen)
- **Changes:** Use `pnpm changeset` to add changesets; **do not edit** `package.json#version` or `CHANGELOG.md` directly (these are managed by Changesets)
- **Release Process:** Changesets automatically publishes independent versions for affected packages

### Contributors

Thank you to all contributors who have helped make Stars Components better!

<a href="https://github.com/wolfstar-project/stars-components/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=wolfstar-project/stars-components" alt="Contributors" />
</a>

### Development Environment

You can contribute without a local setup by using cloud-based development environments:

[![Open in VS Code](https://img.shields.io/badge/Open%20in-VS%20Code-007ACC?style=flat-square&logo=visualstudiocode)](https://vscode.dev/github/wolfstar-project/stars-components)
[![Open in GitHub Codespaces](https://img.shields.io/badge/Open%20in-GitHub%20Codespaces-181717?style=flat-square&logo=github)](https://codespaces.new/wolfstar-project/stars-components)
[![Open in StackBlitz](https://img.shields.io/badge/Open%20in-StackBlitz-1269D3?style=flat-square&logo=stackblitz)](https://stackblitz.com/github/wolfstar-project/stars-components)
[![Open in Gitpod](https://img.shields.io/badge/Open%20in-Gitpod-FFB45B?style=flat-square&logo=gitpod)](https://gitpod.io/#https://github.com/wolfstar-project/stars-components)

---

## License

Stars Components is licensed under the **Apache License 2.0**. See the [LICENSE](./LICENSE) file for details.

Copyright 2022 Wolfstar Project

---

## Resources

- **GitHub:** https://github.com/wolfstar-project/stars-components
- **npm Packages:** https://www.npmjs.com/org/wolfstar
- **Website:** https://wolfstar.rocks
- **Issues & Discussions:** https://github.com/wolfstar-project/stars-components/issues
