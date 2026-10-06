# @wolfstar/kit

`defineModule` and the module runtime for installable Stars modules — the `@nuxt/kit` counterpart. A module is a
package that says it is one; the project lists it in `modules` in `stars.config`:

```ts
// stars.config.ts
import { defineConfig } from '@wolfstar/http-framework/config';

export default defineConfig({
	modules: ['@wolfstar/plugin-cache', ['@wolfstar/plugin-gateway', { shards: 2 }]]
});
```

```ts
// the module's package: its default export
import { defineModule } from '@wolfstar/kit';

export default defineModule<{ ttl: number }>({
	meta: {
		name: '@wolfstar/plugin-cache',
		compatibility: { framework: '>=6.1.0' }
	},
	defaults: { ttl: 60_000 },
	hooks: {
		'build:done': (outcome) => {}
	},
	setup(options, ctx) {
		ctx.addPlugin({ from: new URL('./plugin.js', import.meta.url), options });
		ctx.addImports('@wolfstar/plugin-cache');
	}
});
```

```ts
// plugin.js — runs in the bot
import { definePlugin } from '@wolfstar/http-framework';

export default definePlugin((options) => ({
	name: '@wolfstar/plugin-cache',
	preLoad(client) {}
}));
```

`@wolfstar/kit` depends on `@wolfstar/schema` only, so a module depends on it (as a peer) without pulling in the
framework or the CLI.

## What `setup` can do

`setup(options, ctx)` runs once, in the CLI process, while the project loads. `options` is the module's `defaults`
merged under the ones written in `stars.config` (plain objects merge deeply, arrays are replaced). They come from two
places, the inline ones winning: the `[name, options]` tuple in `modules`, and, when the module declares
`meta.configKey`, a top-level key of that name.

```ts
// the module
export default defineModule<ScheduledTasksOptions>({
	meta: { name: '@wolfstar/plugin-scheduled-tasks', configKey: 'scheduledTasks' },
	defaults: { concurrency: 1 },
	setup(options, ctx) {}
});

declare module '@wolfstar/schema' {
	interface StarsConfig {
		scheduledTasks?: ScheduledTasksOptions;
	}
}

// stars.config.ts
export default defineConfig({
	modules: ['@wolfstar/plugin-scheduled-tasks'],
	scheduledTasks: { bull: { connection: { host: 'localhost', port: 6379 } } }
});
```

A key that no installed module claims is reported by the CLI as an unknown option, so a misspelled one is still an
error. The `declare module` augmentation only applies once the module's types are loaded: import the package in
`stars.config.ts` (`stars prepare` does not reference installed modules yet).

A `configKey` must be a non-empty string, not a built-in key of `stars.config` and not claimed by another installed
module; the value under it must be a plain object. A module installed through `dependencies` or `ctx.installModule`
reads its key as well, with the options passed to `installModule` taking the inline place.

- `ctx.addPlugin(source)` registers a runtime plugin. The plugin lives in the bot's process and `setup` in the CLI's,
  so a plugin is given by **source** — `{ from, export?, options? }` — rather than by value. `from` is a package
  specifier, an absolute path or a `file:` URL (a relative path is rejected: it would resolve differently in each
  build tool); the `export` (default `'default'`) is the plugin or, when it is a function, a factory called with
  `options`, which must be JSON-serialisable. A legacy `Plugin` class is registered as it is, never called.
- `ctx.addImports(preset)` adds a package to the auto imports presets.
- `ctx.hook(name, callback)` / `ctx.callHook(name, …)` use the CLI's hooks (`StarsHooks`), the same registry as `hooks`
  in `stars.config`. A module's `hooks` are registered before `setup` runs; an unknown hook name or a value that is not
  a function fails the install.
- `ctx.installModule(module, options?)` installs another module, and `dependencies` installs modules first. A module
  is installed once, by `meta.name`: the first installation wins.

`meta.compatibility` (`framework`, `stars`) is a semver range checked against the project's installed
`@wolfstar/http-framework` and the running `@wolfstar/cli`; a mismatch fails early instead of leaving a plugin that
silently never runs.

## Production with `tsc` or `none`

`tsdown`, `vite` and Nitro builds register the runtime plugins through the entry. `tsc` and `none` builds cannot be
transformed: `stars dev` preloads the plugins with `node --import`, and for production `stars prepare` (and
`stars build`) writes `.stars/modules.mjs`, to be preloaded the same way: `node --import ./.stars/modules.mjs dist/main.js`.
`stars build`, `stars prepare` and `stars info` report a warning (`MODULES_PRELOAD_REQUIRED`) when such a project has modules with runtime plugins; `stars dev` does not print it, since it preloads them itself. With `env` enabled, `modules.mjs` imports `.stars/env.mjs` first, so the environment is loaded before any plugin is evaluated.

## Programmatic usage

`setupModules({ config, hooks, load, versions })` is what the CLI calls: `load` imports a specifier from the project,
`hooks` is a `hookable`-shaped registry, and the result (`ModulesRuntime`) lists the installed modules, the runtime
plugins, the import presets and the `configKeys` they contributed. Failures are `ModuleError`s with a `code` (`MODULE_LOAD_FAILED`,
`MODULE_INVALID`, `MODULE_INCOMPATIBLE`, `MODULE_SETUP_FAILED`, `MODULE_PLUGIN_INVALID`) and the `moduleName`.
