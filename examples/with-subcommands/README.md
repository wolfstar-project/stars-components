# with-subcommands

Same HTTP bot bootstrap as [`basic`](../basic), plus a `/math` command with
`@RegisterSubcommand` — the pattern used by ring's `config` and staryl's
`twitchsubscriptions` commands.

```bash
cp .env.example src/.env
pnpm --filter with-subcommands dev
```
