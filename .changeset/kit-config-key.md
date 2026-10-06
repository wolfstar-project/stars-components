---
'@wolfstar/kit': minor
---

Make `meta.configKey` work. `setupModules` merges the options a module's `setup` receives as `defaults`, then `config.moduleOptions[configKey]`, then the options given inline (the `[name, options]` tuple, or `ctx.installModule`). A `configKey` that is empty, a built-in `stars.config` key, claimed by another installed module, or holding something other than a plain object fails with `MODULE_INVALID`. The claimed keys are returned as `ModulesRuntime.configKeys`.
