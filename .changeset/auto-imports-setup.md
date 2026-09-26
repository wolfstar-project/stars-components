---
'@wolfstar/http-framework': patch
---

fix(auto-imports): stop auto-importing `@wolfstar/env-utilities`' `setup`, which clashed with the `setup()` scaffolded projects export from `src/lib/setup/all.ts` and printed a duplicated import warning on every build (#219)
