# basic

Minimal Discord HTTP interactions bot using `@wolfstar/http-framework` and `@wolfstar/env-utilities`.

## Setup

```bash
cp .env.example .env
# fill DISCORD_TOKEN and DISCORD_PUBLIC_KEY
pnpm --filter basic dev
```

Point Discord's Interactions Endpoint URL at a public HTTPS URL that forwards to this process (default port `3000`, path `/` or `HTTP_POST_PATH`).

Optional: `REGISTER_COMMANDS=true` (and preferably `DISCORD_GUILD_ID`) to publish `/ping` on startup.

## Layout

- `src/index.ts` — client bootstrap, piece load, listen
- `src/commands/ping.ts` — sample chat-input command
