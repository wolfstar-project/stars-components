# `@wolfstar/create-http-framework`

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
- **i18n support** — optionally add `@wolfstar/http-framework-i18n`
- **Auto-install** — install dependencies immediately after scaffolding

## Options

| Flag                         | Alias | Description                                                 |
| ---------------------------- | ----- | ----------------------------------------------------------- |
| `--overwrite`                |       | Overwrite the target directory if it already exists         |
| `--no-interactive`           |       | Skip all prompts and use defaults / flags                   |
| `--interactive`              | `-i`  | Force interactive prompts even when an AI agent is detected |
| `--package-manager <pm>`     |       | Choose npm, yarn, pnpm, or bun                              |
| `--language <lang>`          |       | Choose TypeScript (`ts`) or JavaScript (`js`)               |
| `--build <tool>`             |       | Choose `tsc6`, `tsc7`, or `tsdown` for TypeScript           |
| `--lint <linter>`            |       | Choose `none`, `eslint`, or `oxlint`                        |
| `--format <formatter>`       |       | Choose `none`, `prettier`, or `oxfmt`                       |
| `--port <number>`            |       | Set the HTTP port (default: `3000`)                         |
| `--i18n` / `--no-i18n`       |       | Enable or disable i18n support                              |
| `--install` / `--no-install` |       | Enable or disable dependency installation                   |
| `--help`                     | `-h`  | Print usage and exit                                        |

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
│   │   └── ping.ts     # Example ping command
│   └── index.ts        # Entry point — starts the HTTP server
├── .env                # Environment variables (DISCORD_TOKEN, DISCORD_PUBLIC_KEY)
├── .gitignore
├── package.json
└── tsconfig.json
```

## Requirements

- Node.js `>=20`
