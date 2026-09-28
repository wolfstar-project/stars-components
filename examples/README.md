# Examples

Runnable HTTP Discord bots for the `@wolfstar/*` packages in this monorepo.

Every example builds and runs through the `stars` CLI (`@wolfstar/cli`) against `@wolfstar/http-framework` v5, and
localizes with [`@wolfstar/plugin-i18next`](https://www.npmjs.com/package/@wolfstar/plugin-i18next) (the deprecated
`@wolfstar/http-framework-i18n` is gone, see the
[migration guide](https://stars-components.js.org/documentation/guide/migration)).

TypeScript examples use decorator registration (`@RegisterCommand`), except the Vite and Nitro ones, whose bundler
does not apply the legacy decorator transform. JavaScript (ESM) examples use the decorator-free
`registerApplicationCommands` API.

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
| [`with-gateway`](./with-gateway)               | TypeScript       | `@wolfstar/plugin-gateway`: gateway events, listeners, in-memory cache    |
| [`with-cache`](./with-cache)                   | TypeScript       | `@wolfstar/plugin-cache`: Redis cache (compression, TTL), `get`/`fetch`   |
| [`with-sharder`](./with-sharder)               | TypeScript       | `@wolfstar/plugin-sharder`: shards across cluster workers, requests       |
| [`with-vite`](./with-vite)                     | TypeScript       | `experimental.enableVite`: Vite build, `vite` block in `stars.config`     |
| [`with-nitro`](./with-nitro)                   | TypeScript       | `experimental.enableNitro`: Nitro server entry, `Client#fetch`            |

## Canonical layout

```text
stars.config.ts|js        # defineConfig({}): entry, build, env files and locales are conventional
src/
  main.ts|js              # setup → new Client({ i18n }) → load → registerCommands → listen
  commands/               # Sapphire Command store
  lib/setup/all.ts|js     # envRun + shared-http-pieces/register (activates plugin-i18next) + setRepository
  lib/i18n/LanguageKeys/  # JS only: key string constants
  locales/{{lng}}/{{ns}}.json
  .env                    # copied from .env.example (gitignored)
```

TypeScript projects extend the generated `.stars/tsconfig.json`; `stars prepare` (run by the `typecheck` scripts,
`stars dev` and `stars build`) writes it. `container.logger` is built into the framework.

## Prerequisites

1. From the repository root: `pnpm install && pnpm build`
2. The gateway examples (`with-gateway`, `with-cache`, `with-sharder`) need Node.js 24.17 or newer
3. For runnable bots, `cp .env.example src/.env` and fill Discord credentials
4. Discord interactions need a **public HTTPS** endpoint (tunnel locally)

## Run

```bash
# TypeScript (stars dev: build, start, restart on change)
pnpm --filter basic dev
pnpm --filter with-subcommands dev
pnpm --filter with-i18n dev
pnpm --filter with-testing test

# Plugins
pnpm --filter with-gateway dev
pnpm --filter with-cache dev
pnpm --filter with-sharder build && pnpm --filter with-sharder start

# Experimental build tools
pnpm --filter with-vite dev
pnpm --filter with-nitro build && pnpm --filter with-nitro start

# JavaScript ESM (stars dev runs src/main.js directly, no build)
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
