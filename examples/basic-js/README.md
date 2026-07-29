# basic-js

Same stack as [`basic`](../basic), written in plain JavaScript (ESM). Commands register
through `registerApplicationCommands` instead of TypeScript decorators.

## Setup

```bash
cp .env.example src/.env
# fill DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_CLIENT_ID
pnpm --filter basic-js dev
```

No build step — Node runs `src/main.js` directly.
