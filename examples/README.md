# Examples

Runnable HTTP Discord bots for the `@wolfstar/*` packages in this monorepo.

TypeScript examples use decorator registration (`@RegisterCommand`). JavaScript (ESM)
examples use the decorator-free `registerApplicationCommands` API.

| Example                                        | Language         | Shows                                                                     |
| ---------------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| [`basic`](./basic)                             | TypeScript       | Canonical bootstrap: env, shared pieces, i18n, `registerCommands`, banner |
| [`basic-js`](./basic-js)                       | JavaScript (ESM) | Same as `basic`, no build step                                            |
| [`with-subcommands`](./with-subcommands)       | TypeScript       | `@RegisterSubcommand` + localized options (`/math`)                       |
| [`with-subcommands-js`](./with-subcommands-js) | JavaScript (ESM) | `registerSubcommand` (`/math`)                                            |
| [`with-i18n`](./with-i18n)                     | TypeScript       | Multi-locale `LanguageKeys` (`en-US` / `es-ES`)                           |
| [`with-i18n-js`](./with-i18n-js)               | JavaScript (ESM) | Same multi-locale flow                                                    |
| [`with-testing`](./with-testing)               | TypeScript       | Vitest + `@wolfstar/http-framework-test-utils`                            |
| [`with-testing-js`](./with-testing-js)         | JavaScript (ESM) | Same test harness in plain JS                                             |

## Canonical layout

```text
src/
  main.ts|js              # setup → i18n → Client → load → registerCommands → listen
  commands/               # Sapphire Command store
  lib/setup/all.ts|js     # envRun + shared-http-pieces/register + setRepository
  lib/setup/logger.ts|js  # container.logger = new Logger()
  lib/i18n/LanguageKeys/  # T() / FT() key constants
  locales/{{lng}}/{{ns}}.json
  .env                    # copied from .env.example (gitignored)
```

## Prerequisites

1. From the repository root: `pnpm install && pnpm build`
2. For runnable bots, `cp .env.example src/.env` and fill Discord credentials
3. Discord interactions need a **public HTTPS** endpoint (tunnel locally)

## Run

```bash
# TypeScript (build then start)
pnpm --filter basic dev
pnpm --filter with-subcommands dev
pnpm --filter with-i18n dev
pnpm --filter with-testing test

# JavaScript ESM (no build)
pnpm --filter basic-js dev
pnpm --filter with-subcommands-js dev
pnpm --filter with-i18n-js dev
pnpm --filter with-testing-js test
```

`registerCommands()` (from `@wolfstar/shared-http-pieces`) pushes guild commands when
`REGISTRY_GUILD_ID` is set, otherwise global commands.

## Scaffolding outside the monorepo

```bash
pnpm create @wolfstar/http-framework my-discord-bot
```
