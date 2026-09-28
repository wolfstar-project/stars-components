# with-cache

A gateway bot whose Discord entities live in **Redis**, with
[`@wolfstar/plugin-cache`](https://www.npmjs.com/package/@wolfstar/plugin-cache) behind
[`@wolfstar/plugin-gateway`](https://www.npmjs.com/package/@wolfstar/plugin-gateway).

## What it shows

- [`src/lib/cache.ts`](./src/lib/cache.ts) — `createRedisCache` (key prefix, gzip compression, per-entity TTL) when
  `REDIS_URL` is set, `createInMemoryCache` with an LRU bound otherwise; nothing else changes between the two
- `cacheFailure: 'emitUncached'` — events keep flowing, built from the payload, while Redis is unreachable
- [`/cache`](./src/commands/cache.ts) — the size of each entity cache, through the storage-agnostic `EntityCache` API
- [`/whoami`](./src/commands/whoami.ts) — a manager's `get` (cache only) versus `fetch` (cache, then the REST API)

## Setup

`@wolfstar/plugin-gateway` requires **Node.js 24.17** or newer. `GuildMembers` is a privileged intent: enable
**Server Members** in the Developer Portal.

```bash
docker compose up -d            # a local Redis on port 6379
cp .env.example src/.env
# fill the Discord credentials and REDIS_URL=redis://localhost:6379
pnpm --filter with-cache dev
```

Leave `REDIS_URL` empty to run with the in-memory cache. The cache survives restarts in Redis: on `READY`, the
gateway client drops the guilds the bot left while it was down.
