---
'@wolfstar/cli': minor
---

Read a module's options from a top-level `stars.config` key (`meta.configKey`). Once the modules are set up, a key that is not built in and that no installed module claimed is reported as `UNKNOWN_OPTION`, with the claimed keys in the fix, so a misspelled key is still an error; the check also runs when `modules` is empty. A `meta.configKey` that is empty, built in, claimed twice or holding a non-object fails with `MODULE_FAILED`.
