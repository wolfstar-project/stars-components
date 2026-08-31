---
'@wolfstar/create-http-framework': minor
---

feat: revamp the generated project template to match the monorepo's `examples/basic` reference
(env/logger/banner setup, `@wolfstar/env-utilities` typed env augmentation), replace i18n
scaffolding with `@wolfstar/plugin-i18next` (dropping the deprecated
`@wolfstar/http-framework-i18n`), and add `--subcommands` / `--subcommands-advanced` / `--testing`
toggles for a subcommand example command (flat, or with subcommand groups) and a vitest +
`@wolfstar/http-framework-test-utils` testing setup.

BREAKING (for scripted `--i18n --no-interactive` callers): the i18n toggle now installs and
scaffolds against `@wolfstar/plugin-i18next` instead of the deprecated
`@wolfstar/http-framework-i18n`.
