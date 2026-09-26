---
'@wolfstar/env-utilities': patch
---

Fix `${VAR}` references between `.env*` files: `loadEnvFiles()` used to expand every file right after loading it, so a specific file (e.g. `.env.local`) referencing a variable defined only in a more generic one (e.g. `.env`) silently resolved to an empty string. All files are now parsed first and expanded once, so references resolve regardless of load order. Precedence (specific over generic, `src/.env*` over root, existing `process.env` values kept) and the `prefix` filter (applied after expansion) are unchanged.

Because a variable is now resolved from the merged result and no longer from the file that defined it, a specific file whose value expands to an empty string (e.g. `K=${MISSING}`) now ends up as `''` in `process.env` instead of falling back to the value from a more generic file. Variables that are part of a circular reference spanning several variables now resolve to an empty string instead of hanging the process.
