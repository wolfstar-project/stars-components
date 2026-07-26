# Examples

Runnable HTTP Discord bots for the `@wolfstar/*` packages in this monorepo.

| Example                                  | Shows                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| [`basic`](./basic)                       | Canonical bootstrap: env setup, shared pieces, i18n, `registerCommands`, banner |
| [`with-subcommands`](./with-subcommands) | `@RegisterSubcommand` + localized options (`/math`)                             |
| [`with-i18n`](./with-i18n)               | Multi-locale `LanguageKeys` (`en-US` / `es-ES`)                                 |
| [`with-testing`](./with-testing)         | Vitest + `@wolfstar/http-framework-test-utils`                                  |

## Canonical layout

```text
src/
  main.ts                 # setup → i18n → Client → load → registerCommands → listen
  commands/               # Sapphire Command store
  lib/setup/all.ts        # envRun + shared-http-pieces/register + setRepository
  lib/setup/logger.ts     # container.logger = new Logger()
  lib/types/augments.ts   # Env interface augmentation
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
pnpm --filter basic dev
pnpm --filter with-subcommands dev
pnpm --filter with-i18n dev
pnpm --filter with-testing test
```

`registerCommands()` (from `@wolfstar/shared-http-pieces`) pushes guild commands when
`REGISTRY_GUILD_ID` is set, otherwise global commands.

## Scaffolding outside the monorepo

```bash
pnpm create @wolfstar/http-framework my-discord-bot
```
