---
'@wolfstar/create-http-framework': minor
---

feat(create-http-framework): scaffold `AGENTS.md`, `llms.txt`, the framework lint rules and an optional dev tunnel (#252)

Every project now gets an `AGENTS.md` (its commands, layout and the rules that are easy to get wrong) and an
`llms.txt` (the upstream documentation by topic), both describing only the features it was created with. With a
linter, the generated `.oxlintrc.json` or `eslint.config.mjs` enables the rules of
`@wolfstar/eslint-plugin-http-framework`. `--tunnel` (or the **Dev tunnel** feature in the prompt) writes
`dev: { tunnel: true }` to `stars.config`, so `stars dev` opens a cloudflared quick tunnel.
