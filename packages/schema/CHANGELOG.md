# @wolfstar/schema

## 0.12.0

### Minor Changes

- [#344](https://github.com/wolfstar-project/stars-components/pull/344) [`1245aad`](https://github.com/wolfstar-project/stars-components/commit/1245aadc8a0e4996154b5dc3d75df51b9a520d86) - Add configurable Nuxt-style, dashboard and plain dev output, with `tui.style` and `--style` while preserving `dev.layout`.

    Check local development ports before startup and offer interactive continue, cancel or next-port choices. Add `--port` and configurable conflict policies for automation, synchronize the chosen runtime port, validate HTTP endpoints and dev listener ports, and report unwritable development directories before building.

    Keep explicit display/health URLs independent of the bot listener, preserve them across port overrides, and ignore unrelated ambient PORT values in framework mode. Infer Nitro runtime ports from NITRO_PORT before PORT. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.11.0

### Minor Changes

- [#335](https://github.com/wolfstar-project/stars-components/pull/335) [`b98cbef`](https://github.com/wolfstar-project/stars-components/commit/b98cbef7581c69d8e7493e2ad880f6785415b078) - Modules can register a directory of pieces with `ctx.addPiecesDir(directory)`. The directory holds one folder per store (`commands`, `listeners`, …) and is handed to `container.stores.registerPath` before the bot loads, through the `\0stars:modules` virtual module or, for `tsc` and `none` builds, the `node --import` preload and `.stars/modules.mjs`. `ModulesRuntime` gains `piecesDirs`, `stars info` lists them, and a relative path fails with `MODULE_PIECES_INVALID`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#338](https://github.com/wolfstar-project/stars-components/pull/338) [`af4289e`](https://github.com/wolfstar-project/stars-components/commit/af4289eaaef37d8e1879bb1984997bffe74bf42c) - `future.compatibilityVersion: 7` makes `stars.config` decide what registers. It is opt-in and not the default: the `@wolfstar/plugin-*` packages found in `package.json` are no longer activated by their name (no `import "<name>/register"` is added to the entry), only the modules in `modules` and the ones they install are. On that version `stars build`, `prepare`, `dev`, `info` and `doctor` warn (`PLUGINS_NOT_REGISTERED`) about an installed plugin that is left out. On version 6 and below nothing changes; `stars info` and `stars doctor` now list the plugins registered by name. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#337](https://github.com/wolfstar-project/stars-components/pull/337) [`c2b1430`](https://github.com/wolfstar-project/stars-components/commit/c2b14303847ceb920d5bb93be8a6d4dcb1e26fa8) - Modules can run code in the bot at the client's lifecycle points. `hooks` in `defineModule` accepts `client:preGenericsInitialization`, `client:preInitialization`, `client:postInitialization`, `client:preLoad` and `client:postListen`, given by source (`{ from, export }`, a function called with `(client, clientOptions)`), and `ctx.addClientHook(name, source)` does the same from `setup`. The hooks of a module share one runtime plugin named after it. `ModulesRuntime` gains `clientHooks`, `stars info` lists them, and a bad hook fails with `MODULE_HOOK_INVALID`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#339](https://github.com/wolfstar-project/stars-components/pull/339) [`cda12c2`](https://github.com/wolfstar-project/stars-components/commit/cda12c27a2ccf313d78a84d55f9114228d0b1689) - Modules can add a directory of locales with `ctx.addLocales(directory)`. The directory is laid out as `<language>/<namespace>.json`, and its namespaces are read when the module is set up. A runtime plugin generated into the `\0stars:modules` source (and the `node --import` preload) merges it into the client's `i18n` option before `@wolfstar/plugin-i18next` builds its handler, keeping the project's own languages directory. `ModulesRuntime` gains `locales`, `stars info` lists them, and a bad directory fails with `MODULE_LOCALES_INVALID`. `@wolfstar/http-framework` now re-exports `getRootData` from `@sapphire/pieces`, which the generated plugin uses to find the default languages directory. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.10.0

### Minor Changes

- [#305](https://github.com/wolfstar-project/stars-components/pull/305) [`a48c529`](https://github.com/wolfstar-project/stars-components/commit/a48c529cb049169080650d16405c9d639f1cd950) - Add ngrok as a second `dev.tunnel` provider. `dev.tunnel: { provider: 'ngrok' }` opens the tunnel through ngrok's official Node SDK instead of a `cloudflared` quick tunnel, and `dev.tunnel.domain` binds a domain reserved in your ngrok account so the hostname survives restarts. `cloudflared` stays the default, so `tunnel: true` and every existing configuration behave as before. `@ngrok/ngrok` is an optional peer dependency that the CLI loads from the project only when the provider is used; the authtoken is read from `NGROK_AUTHTOKEN` in the environment or the project's `.env`. `provider` and `domain` are rejected next to a `url` you already serve, and `domain` without the `ngrok` provider, with the new `TUNNEL_OPTION_CONFLICT` diagnostic. The `t` key, `--tunnel`, `stars info` and `stars doctor` use and report the configured provider, and `stars doctor` checks that the package and the authtoken are present. `@wolfstar/schema` also exports `TUNNEL_PROVIDERS` and `DEFAULT_TUNNEL_PROVIDER`, and `ResolvedTunnelConfig` quick mode now carries `provider` and `domain`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#308](https://github.com/wolfstar-project/stars-components/pull/308) [`a69125a`](https://github.com/wolfstar-project/stars-components/commit/a69125ad7664462bc648a828f660d7361e95a265) - Make the CLI follow `@wolfstar/env-utilities` when it picks varlock by itself. With `future.compatibilityVersion` 6, a project that depends on `@wolfstar/env-utilities`, has a `.env.schema` (`src/.env.schema`, `.env.schema` or `varlock.loadPath`), has `varlock` installed and sets no `env.path` or `env.loader` now resolves `ResolvedEnvConfig.loader` to `'varlock'`, so `stars dev` and `stars doctor` read the variables through `varlock load` instead of the dotenv files the bot does not load, and `dev.url` no longer takes its port from them. `ResolvedEnvConfig.options` still holds what `stars.config` wrote. `detectVarlock(root)` is exported to inspect a project's schema, installation and dependency. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.9.0

### Minor Changes

- [#291](https://github.com/wolfstar-project/stars-components/pull/291) [`d782e5d`](https://github.com/wolfstar-project/stars-components/commit/d782e5d94498f6b2b7216f0533895dd07a3ebf48) - Make the dashboard of `stars dev` clickable. A click on a channel or a level of the sidebar shows or hides it like `Space`, a second click or an `Alt`/`Ctrl` click solos it like `s`, a click on a group header folds the group, a click on a key of the list runs that key, and the wheel scrolls the logs. The new `dev.mouse` option (default `true`) and `stars dev --no-mouse` leave the mouse to the terminal. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#293](https://github.com/wolfstar-project/stars-components/pull/293) [`a5e09ae`](https://github.com/wolfstar-project/stars-components/commit/a5e09aec61803ed9defcfd0078217a30411e6c24) - Keep the top-level `stars.config` keys that are not built in as `ResolvedStarsConfig.moduleOptions` instead of rejecting them, so a module can read its options from a key of its own (`meta.configKey`). `BUILT_IN_CONFIG_KEYS` lists the keys the schema owns, `assertModuleOptionsClaimed` reports the first key that no installed module claimed as `UNKNOWN_OPTION` (the host calls it once the modules are set up), and `ModulesRuntime.configKeys` carries the keys the modules claimed. `StarsConfig` is the interface a module augments to type its key. `ModulesRuntime.configKeys` is a required field, so code that builds a `ModulesRuntime` literal needs to add it (`EMPTY_MODULES_RUNTIME` has it). Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.8.0

### Minor Changes

- [#282](https://github.com/wolfstar-project/stars-components/pull/282) [`1e69874`](https://github.com/wolfstar-project/stars-components/commit/1e698742d1ec940e1cc310a66073af9ce406dddc) - Add `future.compatibilityVersion` `6`, now the latest and the default, gated by the new `SPLIT_TSCONFIG_VERSION` constant. From `6` a `tsdown` build's default `build.tsconfig` is the generated `.stars/tsconfig.app.json`, and `dev.typecheck.projects` lists what `stars typecheck` checks: the generated app and node configs (a `tsc` or `none` project keeps its own tsconfig and gets the node config on top) (`DEFAULT_APP_TSCONFIG`, `DEFAULT_NODE_TSCONFIG`). Projects that pin `5` or `4` keep today's single `.stars/tsconfig.json` and the `tsconfig.json` lookup unchanged. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.7.0

### Minor Changes

- [#275](https://github.com/wolfstar-project/stars-components/pull/275) [`814c8f9`](https://github.com/wolfstar-project/stars-components/commit/814c8f9aed2b5b96150806f09886bac7b76de736) - Generate typed command options from the builders with `stars codegen`.

    `codegen.commands` in `stars.config` (`true`, or `{ output }`, default `src/@types/commands.d.ts`) makes `stars codegen` read the commands from the built bot and write a `CommandOptionsRegistry` entry per command path (`'ping'`, `'math add'`, `'subscriptions twitch add'`). The new `Command.OptionsOf<'math add'>` reads it, so a handler no longer needs a hand-written `interface Options` that can drift from the builder: `required` options are not optional, `choices` are a literal union, `channel_types` narrow the channel and every option has the shape the framework resolves it to. `stars codegen --check` fails with `CODEGEN_OUTDATED` when the file is stale, and `--json` reports it like the i18n generator. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- [#253](https://github.com/wolfstar-project/stars-components/pull/253) [`05a8443`](https://github.com/wolfstar-project/stars-components/commit/05a8443cf6ba64950c9e2fed5ebdd13c03b6cc06) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 0.6.0

### Minor Changes

- [#254](https://github.com/wolfstar-project/stars-components/pull/254) [`46c6169`](https://github.com/wolfstar-project/stars-components/commit/46c616943363d3db39149a56a8e8e5bd55937b30) - feat(schema): add `dev.layout`, `dev.logs`, `dev.commands.refresh` and `dev.hmr` to `stars.config` ([#252](https://github.com/wolfstar-project/stars-components/issues/252))

    The options of the `stars dev` rework: `dev.layout` (`'auto' | 'dashboard' | 'panel'`), `dev.logs` (`channels` and
    `levels` shown at start, `dir` and `keep` for one log file per run), `dev.commands.refresh`
    (`'prompt' | 'auto' | 'off'`) and `dev.hmr`. An unknown value of a fixed-choice option is reported with the new
    `INVALID_CHOICE` diagnostic. `LOG_LEVELS` and `DEFAULT_LOG_LEVELS` are exported. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#265](https://github.com/wolfstar-project/stars-components/pull/265) [`9374fb0`](https://github.com/wolfstar-project/stars-components/commit/9374fb0b50016ebfcdd28d0940cf8d1262adf85d) - feat(schema): accept `'node'` as `env.loader` in `stars.config`, and leave the loader to be detected when it is not set. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.5.0

### Minor Changes

- [#247](https://github.com/wolfstar-project/stars-components/pull/247) [`2d9bf55`](https://github.com/wolfstar-project/stars-components/commit/2d9bf55a29ee43503d415edc800fea4c5a313630) - Add `modules` to `stars.config`: a list of package names or `[name, options]` tuples, installed by the CLI with `@wolfstar/kit`'s `setupModules` before `config:resolved`. The resolved configuration gains `modules` and `runtime` (the runtime plugins and auto-import presets the modules contributed). Runtime plugins are registered in the bot through a `\0stars:modules` virtual module imported before the legacy `/register` imports, which skip packages listed in `modules`, and, for the `tsc` and `none` build tools, through a `node --import` preload in `stars dev` and a `.stars/modules.mjs` file written by `stars prepare` for production (`stars build`, `stars prepare` and `stars info` report a `MODULES_PRELOAD_REQUIRED` warning that points at it; it loads `env` first through `.stars/env.mjs`). A failing module is reported as a `MODULE_FAILED` diagnostic (exit code 2). Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.4.0

### Minor Changes

- [#243](https://github.com/wolfstar-project/stars-components/pull/243) [`19e6bf6`](https://github.com/wolfstar-project/stars-components/commit/19e6bf62dfbf2dba11644d08bbc2570179f0c177) - Add an `env` option to `stars.config` that mirrors `@wolfstar/env-utilities`' setup options and is registered
  automatically as the first import of the built entry, before plugin registrations and the bot's own modules. Add
  Nuxt-style lifecycle `hooks` (`config:resolved`, `env:options`, `prepare:*`, `builder:created`, `tsdown:options`,
  `build:*`, `dev:*`) run with `hookable`.

    `future.compatibilityVersion: 5` is now the default: it is version 4 plus the automatic `env` registration, which
    turns on when the project depends on `@wolfstar/env-utilities` (and stays off with Nitro). Version 4 is still
    supported. Version 3 is end-of-life: it still works, now reports a `COMPATIBILITY_VERSION_EOL` warning, and will be
    removed in the next major.

    Projects generated by `@wolfstar/create-http-framework` with the `tsdown` or `vite` build no longer call `setup()`
    from `@wolfstar/env-utilities` by hand; `tsc` and JavaScript projects keep it and set `env: false`. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.3.0

### Minor Changes

- [#238](https://github.com/wolfstar-project/stars-components/pull/238) [`3aa572c`](https://github.com/wolfstar-project/stars-components/commit/3aa572c78006b3dffdba8ff804c781498fef6153) - Moved the utility decorators out of `@wolfstar/http-framework` into a new package,
  [`@wolfstar/decorators`](https://npmx.dev/package/@wolfstar/decorators), mirroring the split between
  `@sapphire/framework` and `@sapphire/decorators`.

    - **Breaking (`@wolfstar/http-framework`):** `ApplyOptions`, `RequiresGuildContext`, `RequiresDMContext`,
      `RequiresUserPermissions`, `RequiresClientPermissions`, `Enumerable`, `EnumerableMethod`, `createClassDecorator`,
      `createMethodDecorator`, `createProxy`, `createFunctionPrecondition`, and the `PieceConstructor`/`ContextFallback`
      types are no longer exported by the framework. Install `@wolfstar/decorators` and import them from there instead;
      their behaviour is unchanged. The `Register*` decorators and `RestrictGuildIds` stay in the framework.
    - `@wolfstar/decorators` declares `@wolfstar/http-framework` as a peer dependency.
    - `@wolfstar/schema`: `@wolfstar/decorators` is now one of the default `imports.presets`, so projects using the `stars`
      CLI's auto imports keep getting the decorators without an explicit import once the package is installed. Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.2.1

### Patch Changes

- [#227](https://github.com/wolfstar-project/stars-components/pull/227) [`ae15eef`](https://github.com/wolfstar-project/stars-components/commit/ae15eef45d0f85c630b8563b5436b9cd6379e64d) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 0.2.0

### Minor Changes

- [#209](https://github.com/wolfstar-project/stars-components/pull/209) [`6d970e5`](https://github.com/wolfstar-project/stars-components/commit/6d970e5e3e93f5a229d3f49a33b494cbe698df41) - Extract optional Vite and Nitro builders into dedicated server packages, with a shared host context and builder lifecycle contract in schema. Preserve CLI configuration, lazy loading, project-local dependencies, and plugin registration. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#209](https://github.com/wolfstar-project/stars-components/pull/209) [`6d970e5`](https://github.com/wolfstar-project/stars-components/commit/6d970e5e3e93f5a229d3f49a33b494cbe698df41) - Align configuration entry points with Nuxt: add framework schema and package metadata exports, provide a lightweight schema/config helper, and separate schema input types from config resolution while preserving existing exports. Thanks [@RedStar071](https://github.com/RedStar071)!
