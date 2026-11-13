---
'@wolfstar/shared-influx-pieces': minor
---

The module sets `meta.configKey` to `influxPieces`, so the `influxPieces` key of `stars.config` belongs to it (no options yet) and is typed in `defineConfig` through a `StarsConfig` augmentation. `@wolfstar/schema` is a new optional peer, needed only for that type. Refs wolfstar-project/plugins#258.
