---
'@wolfstar/shared-http-pieces': patch
---

Keep `/info` and the shared listeners in the bots that bundle the package: `sideEffects` now lists the `dist/_load-*.js` chunk that registers them, so a bundler no longer drops it from `dist/pieces.js` and `dist/register.js`.
