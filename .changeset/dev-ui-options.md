---
'@wolfstar/schema': minor
---

feat(schema): add `dev.layout`, `dev.logs`, `dev.commands.refresh` and `dev.hmr` to `stars.config` (#252)

The options of the `stars dev` rework: `dev.layout` (`'auto' | 'dashboard' | 'panel'`), `dev.logs` (`channels` and
`levels` shown at start, `dir` and `keep` for one log file per run), `dev.commands.refresh`
(`'prompt' | 'auto' | 'off'`) and `dev.hmr`. An unknown value of a fixed-choice option is reported with the new
`INVALID_CHOICE` diagnostic. `LOG_LEVELS` and `DEFAULT_LOG_LEVELS` are exported.
