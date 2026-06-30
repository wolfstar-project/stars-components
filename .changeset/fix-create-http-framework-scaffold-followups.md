---
'@wolfstar/create-http-framework': patch
---

Address scaffold review follow-ups: restore the `--yes` / `-y` non-interactive alias (kept for backward compatibility with the documented flag), make the generated tsdown `watch:start` script actually pass `--watch`, warn when `--build` is supplied alongside `--language js`, drop the redundant build-tool initializer, and omit the oxlint `typescript` plugin from `.oxlintrc.json` for JavaScript projects.
