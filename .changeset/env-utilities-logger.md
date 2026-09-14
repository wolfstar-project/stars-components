---
'@wolfstar/env-utilities': patch
---

Fix a broken build caused by an incomplete removal of `@wolfstar/logger` (undefined `Logger` reference left by #187). Use `container.logger` from `@sapphire/pieces` when available (populated by `@wolfstar/http-framework`), falling back to `console.debug` for standalone consumers, instead of the deprecated `@wolfstar/logger` package.
