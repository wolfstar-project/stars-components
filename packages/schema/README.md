<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/wolfstar-assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/schema

**Typed `stars.config.*` schema and loader shared by `@wolfstar/http-framework` and `@wolfstar/cli`.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/schema)](https://npmx.dev/package/@wolfstar/schema)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/schema)](https://npmx.dev/package/@wolfstar/schema)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

The `defineConfig` helper, the `StarsConfig` schema, and the `stars.config.{ts,mts,cts,js,mjs,cjs}` loader/validator,
in their own package so `@wolfstar/http-framework` and `@wolfstar/cli` can each depend on it without depending on
each other — the way `@nuxt/schema` sits between `nuxt` and `@nuxt/cli`.

This module is intentionally tiny and side-effect free: importing it from a `stars.config.ts` file must never start
a bot nor pull in the CLI's runtime.

`@wolfstar/http-framework` re-exports this package's public surface from `@wolfstar/http-framework/config`, so
existing `import { defineConfig } from '@wolfstar/http-framework/config'` code keeps working unchanged — most
projects should keep importing it from there rather than depending on this package directly. See the
[`@wolfstar/http-framework` README](../http-framework#project-configuration-starsconfig) for the full configuration
reference.

## Usage

```typescript
// stars.config.ts
import { defineConfig } from '@wolfstar/schema';

export default defineConfig({});
```

## Package structure

- `src/types/config.ts` defines the public input types without runtime dependencies.
- `src/config.ts` provides the identity helper and type exports. The `@wolfstar/schema/config` entry is suitable
  for configuration files that only need `defineConfig`, without loading filesystem resolution or diagnostics.
- `src/config/` owns discovery, validation, defaults, and resolution.
- `src/index.ts` preserves the complete public API, including the helper and loader.

The framework exposes package-root `config.js`/`config.d.ts` and `schema.js`/`schema.d.ts` facades, following
[Nuxt's package layout](https://github.com/nuxt/nuxt/tree/main/packages/nuxt). Both forward this package unchanged
for backwards compatibility. The CLI depends directly on this package, keeping the dependency graph acyclic.

## Server integrations

Stars already separates Vite and Nitro behind the CLI's `Builder` contract, with lazy adapter loading and
project-local dependency resolution. They consume resolved schema options and wrap the framework's Fetch API.
Nuxt's [`nitro-server`](https://github.com/nuxt/nuxt/tree/main/packages/nitro-server) and
[`vite-server`](https://github.com/nuxt/nuxt/tree/main/packages/vite-server) are separate server integrations;
Stars' adapters currently share CLI plugin registration and project resolution utilities. Keep them in the CLI
until they need an independently consumable lifecycle: extracting packages now would require extracting those
shared utilities too, with no additional server functionality. Neither adapter belongs in the schema package.
