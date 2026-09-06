---
'@wolfstar/cli': minor
'@wolfstar/http-framework': minor
---

feat: align the stars dev terminal UI with Nuxt's pinned panel and folded logs

The tsdown builder now leaves dependencies external with `deps.neverBundle`, removing the deprecated option and
keeping shared dependencies external for dynamically loaded pieces. Its entry list, target and output-size table
are suppressed; warnings and errors remain available in the log browser and log file.

The bottom-aligned panel displays an animated Stars wordmark, aligned URLs, actual build-phase progress and elapsed
time, then readiness timing and diagnostic counts. `dev.banner` accepts custom text/lines or `false` to hide the
wordmark. Log, help and session-info views use the alternate screen and restore the panel when closed. Logs support
search, source/level filters, selection, copying, and jumping to the last error with context. Stack frames are dimmed
and no longer counted as separate errors; Node warnings are classified as warnings rather than errors.

Rebuild state and duration now reset on Rolldown's per-build hook, including recovery from a failed build. Reduced
motion preserves the elapsed clock, and redirected input, dumb terminals and small panes get a safe plain fallback.
