# basic

Minimal HTTP Discord bot using the `@wolfstar/*` HTTP framework stack.

## What it wires up

- `@wolfstar/env-utilities` — load `src/.env` and typed parsers
- `@wolfstar/shared-http-pieces/register` — shared `/info` + error listeners
- `@wolfstar/plugin-i18next` — the `i18n` client option; `src/locales` is copied next to the build output
- `@wolfstar/http-framework` — `Client` → `load()` → `listen()`
- `registerCommands()` — guild push when `REGISTRY_GUILD_ID` is set, else global
- `container.logger` (built into the framework) + `@wolfstar/start-banner` — logger and startup banner

## The build

The intentionally empty [`stars.config.ts`](./stars.config.ts) demonstrates the defaults: the entry and output are
detected, tsdown and auto imports are wired automatically, and `src/locales` is copied into the build. See the
[framework README](../../packages/http-framework#the-build-tsdown).

The `build` and `dev` scripts run the CLI by path (`node ../../packages/cli/dist/cli.js …`) because the `stars`
executable is only linked once `@wolfstar/cli` is installed from npm; in a real project they are `stars build` and
`stars dev`.

## Setup

```bash
cp .env.example src/.env
# fill DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_CLIENT_ID
pnpm --filter basic dev
```

Point Discord's Interactions Endpoint URL at a public HTTPS URL that forwards to
`HTTP_ADDRESS:HTTP_PORT` (default `0.0.0.0:3000`).
