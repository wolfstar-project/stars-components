---
'@wolfstar/cli': minor
---

feat: build `tsdown` from `stars.config`, and wire auto imports into it

`stars build` and `stars dev` now derive the whole `tsdown` build from `stars.config`, so a base project configures
nothing: every source file next to `entry` (minus `*.test.*`/`*.spec.*`), emitted one-to-one so the stores keep
loading pieces from `dist/commands` at runtime, ESM on `platform: 'node'`, the project's tsconfig, sourcemaps and
treeshaking on, minification off, dependencies left in `node_modules` (`deps.skipNodeModulesBundle`), no declaration
files, and the output extension `build.output` implies. These are the options the WolfStar bots already keep in their
own `tsdown.config.ts`, so migrating one is deleting the file and moving its plugins across.

The build also ships Nuxt's alias prefixes: `~` and `@` resolve to the entry's directory, `~~` and `@@` to the
project root. A target written as a relative path (`'./src/lib'`) is resolved against the project root the way every
other path in `stars.config` is.

The project's `tsdown` block is layered on top: its values win, and its `plugins` and `alias` entries are added to
what `stars` contributes rather than replacing them.

The auto imports plugin is injected by the CLI instead of by the project's own configuration file, so
`future: { compatibilityVersion: 4 }` is all a project needs for the framework's exports and its `src/lib/**`,
`src/utils/**` to be usable without an `import` statement.

With `future.compatibilityVersion: 3` a `tsdown.config.*` still drives the build and everything above is merged over
it, so options can move across one at a time.

The `vite` block finally reaches Vite too: it was resolved and validated, but never passed to `vite.build()`.

`stars info` gains a `Future` section with the compatibility version in effect, and two `Build` rows: the file the
build tool is configured from, and the option names the `tsdown`/`vite` block sets.
