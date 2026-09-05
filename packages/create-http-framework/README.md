<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/create-http-framework

**Scaffold a new <a href="https://github.com/wolfstar-project/stars-components/tree/main/packages/http-framework">@wolfstar/http-framework</a> bot in seconds.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/create-http-framework)](https://npmx.dev/package/@wolfstar/create-http-framework)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/create-http-framework)](https://npmx.dev/package/@wolfstar/create-http-framework)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

A CLI scaffolding tool for creating new [WolfStar HTTP Framework](https://github.com/wolfstar-project/stars-components/tree/main/packages/http-framework) bot projects.

## Usage

```bash
npm create @wolfstar/http-framework@latest my-discord-bot
# or
pnpm create @wolfstar/http-framework my-discord-bot
# or
yarn create @wolfstar/http-framework my-discord-bot
# or
bun create @wolfstar/http-framework my-discord-bot
```

The CLI will guide you through the following prompts:

- **Project name** — an npm-compatible name for your bot
- **Package manager** — npm, yarn, pnpm, or bun
- **Language** — TypeScript or JavaScript
- **Build tool** — tsdown, TypeScript 6, or the TypeScript 7 release candidate
- **Linter and formatter** — Oxlint / ESLint and Oxfmt / Prettier
- **Port** — the port the HTTP server will listen on (default: `3000`)
- **Optional features** (multiselect) —
    - **i18n** — add [`@wolfstar/plugin-i18next`](https://github.com/wolfstar-project/stars-components/tree/main/packages/plugin-i18next)
    - **Subcommands** — add an example command that uses subcommands
    - **Testing** — set up Vitest with [`@wolfstar/http-framework-test-utils`](https://github.com/wolfstar-project/stars-components/tree/main/packages/http-framework-test-utils)
- **Auto-install** — install dependencies immediately after scaffolding

## Options

| Flag                                 | Alias | Description                                                                |
| ------------------------------------ | ----- | -------------------------------------------------------------------------- |
| `--overwrite`                        |       | Overwrite the target directory if it already exists                        |
| `--no-interactive`                   |       | Skip all prompts and use defaults / flags                                  |
| `--interactive`                      | `-i`  | Force interactive prompts even when an AI agent is detected                |
| `--package-manager <pm>`             |       | Choose npm, yarn, pnpm, or bun                                             |
| `--language <lang>`                  |       | Choose TypeScript (`ts`) or JavaScript (`js`)                              |
| `--build <tool>`                     |       | Choose `tsc6`, `tsc7`, or `tsdown` for TypeScript                          |
| `--lint <linter>`                    |       | Choose `none`, `eslint`, or `oxlint`                                       |
| `--format <formatter>`               |       | Choose `none`, `prettier`, or `oxfmt`                                      |
| `--port <number>`                    |       | Set the HTTP port (default: `3000`)                                        |
| `--i18n` / `--no-i18n`               |       | Enable or disable `@wolfstar/plugin-i18next` scaffolding                   |
| `--subcommands` / `--no-subcommands` |       | Enable or disable the example subcommand command                           |
| `--testing` / `--no-testing`         |       | Enable or disable the Vitest + `@wolfstar/http-framework-test-utils` setup |
| `--install` / `--no-install`         |       | Enable or disable dependency installation                                  |
| `--help`                             | `-h`  | Print usage and exit                                                       |

## Non-interactive / AI agent mode

When the CLI detects an AI agent is running it (via [`@vercel/detect-agent`](https://www.npmjs.com/package/@vercel/detect-agent)), it automatically enters non-interactive mode, equivalent to passing `--no-interactive`. A project name argument is required in this mode:

```bash
create-http-framework my-discord-bot --no-interactive
```

## Generated project structure

```
my-discord-bot/
├── src/
│   ├── commands/
│   │   ├── ping.ts               # Example ping command
│   │   └── math.ts               # Example command with subcommands (--subcommands)
│   ├── lib/
│   │   ├── setup/
│   │   │   ├── all.ts            # Aggregates setup imports
│   │   │   └── logger.ts         # Logger configuration
│   │   └── types/
│   │       └── augments.ts       # Module augmentations (TypeScript only)
│   ├── locales/
│   │   └── en-US/
│   │       └── commands/
│   │           └── ping.json     # Example locale resource (--i18n)
│   ├── @types/
│   │   └── i18next.d.ts          # Generated i18next augmentation (--i18n)
│   └── main.ts                   # Entry point — starts the HTTP server
├── tests/
│   └── ping.test.ts              # Example test (--testing)
├── vitest.config.ts              # Vitest configuration (--testing)
├── vitest.setup.ts               # Vitest setup file (--testing)
├── README.md                     # Generated project README
├── .env                          # Environment variables (DISCORD_TOKEN, DISCORD_PUBLIC_KEY)
├── .gitignore
├── package.json
└── tsconfig.json
```

- `src/locales/en-US/commands/ping.json` and `src/@types/i18next.d.ts` are only generated when **i18n** is enabled.
- `src/@types/i18next.d.ts` is produced by `@wolfstar/i18next-type-generator`; the CLI runs it automatically at the end of scaffolding, and it can be re-run any time locale files change (see [`generate:i18n`](#i18n-type-generation) below).
- `src/commands/math.ts` is only generated when **Subcommands** is enabled.
- `tests/ping.test.ts`, `vitest.config.ts`, and `vitest.setup.ts` are only generated when **Testing** is enabled.

### i18n type generation

When i18n is enabled, the generated `package.json` includes a `generate:i18n` script that (re)generates `src/@types/i18next.d.ts` from the JSON files under `src/locales/`:

```bash
pnpm generate:i18n
```

The CLI runs this script automatically once at the end of scaffolding; re-run it manually whenever you add or edit locale keys so the generated types stay in sync.

## Requirements

- Node.js `>=20`
