---
'@wolfstar/cli': minor
---

`stars codegen --only <i18n|commands>` runs a single generator (repeat the flag or comma-separate it for several), so a CI job can check the i18next types, which only read the locale files, without the bot's secrets or a build. Naming a generator that is off in `stars.config` fails with `CODEGEN_GENERATOR_DISABLED` instead of passing without checking anything.
