# with-sharder

A gateway bot whose shards are spread across **`node:cluster` workers** by
[`@wolfstar/plugin-sharder`](https://www.npmjs.com/package/@wolfstar/plugin-sharder), each running a
[`@wolfstar/plugin-gateway`](https://www.npmjs.com/package/@wolfstar/plugin-gateway) `GatewayClient`.

## What it shows

- [`src/main.ts`](./src/main.ts) — one script for both sides: the manager (`ShardClient.context === null`) spawns
  the workers with `strategy: 'cluster'`, and the workers run [`src/shard.ts`](./src/shard.ts)
- `shard.gatewayOptions` and `shard.identifyThrottler` — the gateway shards assigned to the worker, and identifies
  paced by the manager across every worker
- `shard.setRequestHandler` + [`/guilds`](./src/commands/guilds.ts) — `broadcastRequest` collects one reply per
  worker, the sharder's replacement for `broadcastEval`
- Cluster workers share the HTTP port: every worker serves interactions, Node balances them

## Setup

`@wolfstar/plugin-gateway` requires **Node.js 24.17** or newer.

```bash
cp .env.example src/.env
# fill the Discord credentials, optionally SHARDER_CLUSTERS
pnpm --filter with-sharder build
pnpm --filter with-sharder start
```

`stars dev` works too, but it restarts the manager (and so every worker) on each change. For several machines, the
same shard script runs under `ShardManagerProxy` with a `NetworkStrategy` manager; see the plugin's README.
