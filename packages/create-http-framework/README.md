# `@wolfstar/create-http-framework`

A CLI scaffolding tool for creating new [WolfStar HTTP Framework](https://github.com/wolfstar-project/stars-components/tree/main/packages/http-framework) bot projects.

## Usage

```bash
npm create http-framework@latest my-discord-bot
# or
pnpm create http-framework my-discord-bot
# or
yarn create http-framework my-discord-bot
# or
bun create http-framework my-discord-bot
```

The CLI will guide you through the following prompts:

- **Project name** — an npm-compatible name for your bot
- **Port** — the port the HTTP server will listen on (default: `3000`)
- **i18n support** — optionally add `@wolfstar/http-framework-i18n`
- **Auto-install** — install dependencies immediately after scaffolding

## Options

| Flag            | Alias | Description                                                          |
| --------------- | ----- | -------------------------------------------------------------------- |
| `--overwrite`   |       | Overwrite the target directory if it already exists                  |
| `--yes`         | `-y`  | Skip all prompts and use defaults (port 3000, no i18n, auto-install) |
| `--interactive` | `-i`  | Force interactive prompts even when an AI agent is detected          |
| `--help`        | `-h`  | Print usage and exit                                                 |

## Non-interactive / AI agent mode

When the CLI detects an AI agent is running it (via [`@vercel/detect-agent`](https://www.npmjs.com/package/@vercel/detect-agent)), it automatically enters non-interactive mode — equivalent to passing `--yes`. A project name argument is required in this mode:

```bash
create-http-framework my-discord-bot --yes
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
