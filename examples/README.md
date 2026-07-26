# Examples

Runnable samples for the `@wolfstar/*` packages in this monorepo. Prefer these over copying snippets from docs when you want a full project layout.

| Example                                  | Shows                                                     |
| ---------------------------------------- | --------------------------------------------------------- |
| [`basic`](./basic)                       | Minimal HTTP Discord bot with a `/ping` command           |
| [`with-subcommands`](./with-subcommands) | Chat-input subcommands and options                        |
| [`with-i18n`](./with-i18n)               | `@wolfstar/http-framework-i18n` locales and keyed replies |
| [`with-testing`](./with-testing)         | Vitest + `@wolfstar/http-framework-test-utils`            |

## Prerequisites

1. Install dependencies from the repository root (`pnpm install`).
2. Build the workspace packages so `workspace:*` imports resolve (`pnpm build`).
3. For the runnable bots (`basic`, `with-subcommands`, `with-i18n`), copy `.env.example` to `.env` and fill in Discord credentials.

Discord interactions require a **public HTTPS** endpoint. Locally, expose the bot with a tunnel (Cloudflare Tunnel, ngrok, etc.) and set that URL as the application's Interactions Endpoint URL.

## Run an example

```bash
# from the repository root
pnpm --filter basic dev
pnpm --filter with-subcommands dev
pnpm --filter with-i18n dev

# tests only (no Discord credentials)
pnpm --filter with-testing test
```

Optional: set `REGISTER_COMMANDS=true` to push command definitions on startup. Set `DISCORD_GUILD_ID` as well to register guild commands (faster while iterating) instead of global ones.

## Scaffolding a new app

For a greenfield project outside this repo, use the published CLI:

```bash
pnpm create @wolfstar/http-framework my-discord-bot
```

These examples stay in the monorepo as living documentation and use `workspace:*` versions of the packages.
