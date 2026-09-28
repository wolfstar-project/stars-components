# with-gateway

HTTP interactions **and** gateway events in one bot, with
[`@wolfstar/plugin-gateway`](https://www.npmjs.com/package/@wolfstar/plugin-gateway) and an in-memory
[`@wolfstar/plugin-cache`](https://www.npmjs.com/package/@wolfstar/plugin-cache).

## What it shows

- `GatewayClient` — a `Client` that also connects to the gateway; `client.start()` loads the pieces, starts the HTTP
  interactions endpoint, and connects the shards in one call
- `createInMemoryCache({ maxSize })` — every dispatch is written into the cache before its event is emitted
- [`src/listeners`](./src/listeners) — gateway events handled by regular listener pieces, with
  `@RegisterAsGatewayListener` and `EventGatewayListener`: a `shardReady` log and a `!howl` message command
- [`/server`](./src/commands/server.ts) — an HTTP slash command reading the guild from the gateway cache
  (`client.guilds.get`)

`@wolfstar/plugin-gateway` and `@wolfstar/plugin-cache` are libraries rather than `register`-style plugins: the
Stars CLI only activates `@wolfstar/plugin-*` dependencies that ship a `/register` entry, so nothing is injected here.

## Setup

`@wolfstar/plugin-gateway` requires **Node.js 24.17** or newer. Enable the **Message Content** privileged intent of
the application in the Developer Portal for `!howl`.

```bash
cp .env.example src/.env
# fill DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_CLIENT_ID
pnpm --filter with-gateway dev
```

Unlike a bot only serving HTTP interactions, a gateway connection is long-lived: deploy it as a persistent process.
To spread the shards across processes, see [`with-sharder`](../with-sharder); to keep the cache in Redis, see
[`with-cache`](../with-cache).
