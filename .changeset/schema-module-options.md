---
'@wolfstar/schema': minor
---

Keep the top-level `stars.config` keys that are not built in as `ResolvedStarsConfig.moduleOptions` instead of rejecting them, so a module can read its options from a key of its own (`meta.configKey`). `BUILT_IN_CONFIG_KEYS` lists the keys the schema owns, `assertModuleOptionsClaimed` reports the first key that no installed module claimed as `UNKNOWN_OPTION` (the host calls it once the modules are set up), and `ModulesRuntime.configKeys` carries the keys the modules claimed. `StarsConfig` is the interface a module augments to type its key.
