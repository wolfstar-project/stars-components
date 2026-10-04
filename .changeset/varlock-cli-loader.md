---
'@wolfstar/env-utilities': minor
---

feat(env-utilities): load the experimental `varlock` loader through `varlock load --format json-full` instead of `varlock/auto-load`. `parsed` now holds exactly the resolved keys, `path` and `env` map to `--path` and `--env`, and an invalid schema throws an `Error` with varlock's summary instead of exiting the process.
