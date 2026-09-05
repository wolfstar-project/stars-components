---
'basic': patch
---

chore: move the example's build into `stars.config.ts`

The example's `tsdown.config.ts` is gone: its locale-copying plugin and target now live in the `tsdown` block of
`stars.config.ts`, which also opts into `future: { compatibilityVersion: 4 }`. Its `build` and `dev` scripts run the
CLI by path, since the `stars` executable is only linked once `@wolfstar/cli` is installed from npm.
