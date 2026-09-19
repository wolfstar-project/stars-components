---
'@wolfstar/http-framework': minor
'@wolfstar/cli': major
---

Split the `stars.config.*` schema and loader (`defineConfig`, `loadStarsConfig`, `configDiagnostics` and friends) out
of `@wolfstar/http-framework` into a new package, [`@wolfstar/stars-config`](https://npmx.dev/package/@wolfstar/stars-config),
and made `@wolfstar/http-framework` depend on `@wolfstar/cli` for its own `stars` binary — the same split Nuxt has
between `nuxt`, `@nuxt/cli` and `@nuxt/schema`.

- `@wolfstar/http-framework/config` re-exports `@wolfstar/stars-config`'s public surface unchanged, so existing
  `import { defineConfig } from '@wolfstar/http-framework/config'` code keeps working with no changes needed.
- `@wolfstar/http-framework` now depends on `@wolfstar/cli` and ships a `stars` bin (`bin/stars.mjs`, re-exporting
  `@wolfstar/cli/cli`), the way `nuxt` ships `nuxi`'s binary — installing `@wolfstar/http-framework` is now enough to
  get the `stars` command, no separate `@wolfstar/cli` install required.
- **Breaking for `@wolfstar/cli`:** it no longer depends on `@wolfstar/http-framework` (matching `@nuxt/cli` having no
  dependency on `nuxt`) — it now depends on `@wolfstar/stars-config` for the config schema/loader instead. Projects
  that installed `@wolfstar/cli` without also depending on `@wolfstar/http-framework` directly (uncommon, since the
  CLI has nothing to build without it) now need to add `@wolfstar/http-framework` themselves; every project scaffolded
  by `@wolfstar/create-http-framework`, or that already depends on `@wolfstar/http-framework`, is unaffected.
  `@wolfstar/cli`'s own public exports (`loadStarsConfig`, `configDiagnostics`, `ConfigDiagnosticCode`,
  `ResolvedStarsConfig`, re-exported from `@wolfstar/stars-config`) are unchanged.

This was needed because `@wolfstar/cli` already depended on `@wolfstar/http-framework`: adding the reverse dependency
(for the new `stars` bin) without this split would have made the two packages depend on each other, which this
monorepo's build graph (and any tool resolving workspace dependencies) cannot build.
