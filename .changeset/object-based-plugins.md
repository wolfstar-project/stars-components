---
'@wolfstar/http-framework': minor
---

Add Vite-style, object-based plugins: `definePlugin` and the `StarsPlugin` type (`name`, `enforce: 'pre' | 'post'`, `apply`, and the five lifecycle hooks as `(client, options) => …`), a `plugins` option in `ClientOptions` for per-client plugins, and `PluginHookError`, which attributes a failing hook to its plugin name. `PluginManager` now orders hooks as `pre`, plain, then `post` (registration order inside each group) and `Client.use` accepts plugin objects and nested arrays. The legacy `Plugin` class, symbol hooks and `registerXHook` keep working through an adapter and emit a one-time `DeprecationWarning` (`HTTP_FRAMEWORK_LEGACY_PLUGIN`) per plugin.
