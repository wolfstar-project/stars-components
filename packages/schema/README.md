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

Stars separates the optional integrations into [`@wolfstar/vite-server`](../vite-server) and
[`@wolfstar/nitro-server`](../nitro-server), following Nuxt's server package boundaries.
Both implement the `Builder` contract exported by this schema package. The CLI loads them on demand and supplies
a `BuilderContext` for project dependency resolution and plugin registration, so neither integration depends on
the CLI or framework runtime. Process supervision and the external-build watcher remain in the CLI.
