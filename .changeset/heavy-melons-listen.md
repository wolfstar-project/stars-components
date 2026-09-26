---
'@wolfstar/shared-http-pieces': patch
---

fix(shared-http-pieces): keep the bundled locales when the plugin's `register` entrypoint is imported first

`@wolfstar/plugin-i18next` reads the `i18n` client option exactly once, in its own
`preGenericsInitialization` hook, so this package's hook has to run before it. That held while this
package's `register` entrypoint was the only thing activating the plugin, but the Stars CLI now
prepends `import '@wolfstar/plugin-i18next/register'` to the entry when the plugin is a runtime
dependency, which makes the plugin's hook register — and run — first. The bundled `commands/shared`
namespace was then never merged into the handler, and `/info` rendered raw keys such as
`infoFieldUptimeTitle` (see #192).

The hook now rebuilds `container.i18n` from the merged options whenever the plugin's hook already ran,
so the bundled locales load whichever order the two `register` entrypoints are evaluated in. The handler
is only read from in its constructor and `init()` runs later, in the plugin's `preLoad` hook, so the
discarded instance is never initialized. Fixes #218.
