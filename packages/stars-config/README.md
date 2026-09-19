<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/wolfstar-assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/stars-config

**Typed `stars.config.*` schema and loader shared by `@wolfstar/http-framework` and `@wolfstar/cli`.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/stars-config)](https://npmx.dev/package/@wolfstar/stars-config)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/stars-config)](https://npmx.dev/package/@wolfstar/stars-config)
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
import { defineConfig } from '@wolfstar/stars-config';

export default defineConfig({});
```
