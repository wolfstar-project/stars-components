---
'@wolfstar/schema': minor
'@wolfstar/vite-server': minor
'@wolfstar/cli': minor
---

`future.compatibilityVersion: 7` makes `stars.config` decide what registers. It is opt-in and not the default: the `@wolfstar/plugin-*` packages found in `package.json` are no longer activated by their name (no `import "<name>/register"` is added to the entry), only the modules in `modules` and the ones they install are. On that version `stars build`, `prepare`, `dev`, `info` and `doctor` warn (`PLUGINS_NOT_REGISTERED`) about an installed plugin that is left out. On version 6 and below nothing changes; `stars info` and `stars doctor` now list the plugins registered by name.
