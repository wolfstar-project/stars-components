# with-nitro

An HTTP bot built and served by **Nitro**, through the `stars` CLI's experimental `experimental.enableNitro` flag
(`@wolfstar/http-framework` v5).

## What it shows

- [`stars.config.ts`](./stars.config.ts) — `experimental.enableVite` + `experimental.enableNitro`, and the Nitro
  `preset` the output targets
- [`src/main.ts`](./src/main.ts) — the entry **default-exports the loaded `Client`** instead of calling `listen()`;
  the generated Nitro server entry forwards every request to `client.fetch(request)`, the Fetch-based counterpart of
  `listen()` added in v5
- `stars build` writes `.output/` (not `dist/`) laid out for the preset; `stars dev` rebuilds and restarts on changes
- Pieces are loaded with `container.stores.loadPiece`, since the bundle has no `commands` directory to scan

## Setup

```bash
cp .env.example .env
# fill DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_CLIENT_ID
pnpm --filter with-nitro build
pnpm --filter with-nitro start   # node .output/server/index.mjs
```

Switch `experimental.nitro.preset` to deploy the same bot to a serverless or edge platform; `client.fetch()` also
works directly with `Bun.serve`, `Deno.serve`, or a Worker's `fetch` handler without Nitro.
