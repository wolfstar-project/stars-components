---
'@wolfstar/http-framework-utilities': patch
---

Widen the optional `@wolfstar/plugin-gateway` peer dependency to `>=0.8.0`. A caret range on a `0.x` version only matches one minor, so `^0.8.0` reported an unmet peer for every newer plugin release, including the current 0.11.0.
