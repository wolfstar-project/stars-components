# with-vite

An HTTP bot built with **Vite** instead of `tsdown`, through the `stars` CLI's experimental
`experimental.enableVite` flag.

## What it shows

- [`stars.config.ts`](./stars.config.ts) — `experimental.enableVite` opts in; with `vite` installed,
  `build.tool: 'auto'` resolves to `'vite'`, and the top-level `vite` block is merged into the derived configuration
  (here a `define` replaced at build time)
- `stars build` runs a Vite SSR build of `src/main.ts` into `dist/main.js` (dependencies stay external);
  `stars dev` rebuilds with Vite's watcher and restarts the bot
- [`src/main.ts`](./src/main.ts) — the bundle has no `commands` directory to scan, so pieces are loaded with
  `container.stores.loadPiece` and `client.load({ baseUserDirectory: null })`
- Installed `@wolfstar/plugin-*` packages with a `/register` entry are activated by the Vite build too

## Setup

```bash
cp .env.example src/.env
# fill DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_CLIENT_ID
pnpm --filter with-vite dev
```

To deploy on a Fetch-based runtime rather than a `node:http` process, see [`with-nitro`](../with-nitro).
