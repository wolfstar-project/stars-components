# basic-js

Same stack as [`basic`](../basic), written in plain JavaScript (ESM). Commands register
through `registerApplicationCommands` instead of TypeScript decorators.

## Setup

```bash
cp .env.example src/.env
# fill DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_CLIENT_ID
pnpm --filter basic-js dev
```

No build step: `stars dev` (with the empty [`stars.config.js`](./stars.config.js), `build.tool` resolves to
`'none'`) runs `src/main.js` directly and restarts it on every change. Without a bundler the CLI cannot inject
plugins' `register` entries, so `src/lib/setup/all.js` keeps importing `@wolfstar/shared-http-pieces/register`, which
activates `@wolfstar/plugin-i18next`.
