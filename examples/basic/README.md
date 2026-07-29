# basic

Minimal HTTP Discord bot using the `@wolfstar/*` HTTP framework stack.

## What it wires up

- `@wolfstar/env-utilities` — load `src/.env` and typed parsers
- `@wolfstar/shared-http-pieces/register` — shared `/info` + error listeners
- `@wolfstar/http-framework-i18n` — locale load + `init`
- `@wolfstar/http-framework` — `Client` → `load()` → `listen()`
- `registerCommands()` — guild push when `REGISTRY_GUILD_ID` is set, else global
- `@wolfstar/logger` + `@wolfstar/start-banner` — container logger and startup banner

## Setup

```bash
cp .env.example src/.env
# fill DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_CLIENT_ID
pnpm --filter basic dev
```

Point Discord's Interactions Endpoint URL at a public HTTPS URL that forwards to
`HTTP_ADDRESS:HTTP_PORT` (default `0.0.0.0:3000`).
