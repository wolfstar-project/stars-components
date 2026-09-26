---
'@wolfstar/env-utilities': patch
---

Fix `${VAR}` references between `.env*` files: `loadEnvFiles()` used to expand every file right after loading it, so a specific file (e.g. `.env.local`) referencing a variable defined only in a more generic one (e.g. `.env`) silently resolved to an empty string. All files are now parsed first and expanded once, so references resolve regardless of load order. Precedence (specific over generic, `src/.env*` over root, existing `process.env` values kept) and the `prefix` filter (applied after expansion) are unchanged.
