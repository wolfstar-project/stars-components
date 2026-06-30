---
'@wolfstar/create-http-framework': patch
---

Address scaffold review follow-ups: standardize non-interactive mode on `--no-interactive` (drop the `--yes` / `-y` alias) and update the README and `--help` output to match, make the generated tsdown `watch:start` script actually pass `--watch`, warn when `--build` is supplied alongside `--language js`, drop the redundant build-tool initializer, and omit the oxlint `typescript` plugin from `.oxlintrc.json` for JavaScript projects.
