# @wolfstar/vite-server

## 0.5.1

### Patch Changes

- Updated dependencies [[`1245aad`](https://github.com/wolfstar-project/stars-components/commit/1245aadc8a0e4996154b5dc3d75df51b9a520d86)]:
    - @wolfstar/schema@0.12.0

## 0.5.0

### Minor Changes

- [#335](https://github.com/wolfstar-project/stars-components/pull/335) [`b98cbef`](https://github.com/wolfstar-project/stars-components/commit/b98cbef7581c69d8e7493e2ad880f6785415b078) - Modules can register a directory of pieces with `ctx.addPiecesDir(directory)`. The directory holds one folder per store (`commands`, `listeners`, …) and is handed to `container.stores.registerPath` before the bot loads, through the `\0stars:modules` virtual module or, for `tsc` and `none` builds, the `node --import` preload and `.stars/modules.mjs`. `ModulesRuntime` gains `piecesDirs`, `stars info` lists them, and a relative path fails with `MODULE_PIECES_INVALID`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#338](https://github.com/wolfstar-project/stars-components/pull/338) [`af4289e`](https://github.com/wolfstar-project/stars-components/commit/af4289eaaef37d8e1879bb1984997bffe74bf42c) - `future.compatibilityVersion: 7` makes `stars.config` decide what registers. It is opt-in and not the default: the `@wolfstar/plugin-*` packages found in `package.json` are no longer activated by their name (no `import "<name>/register"` is added to the entry), only the modules in `modules` and the ones they install are. On that version `stars build`, `prepare`, `dev`, `info` and `doctor` warn (`PLUGINS_NOT_REGISTERED`) about an installed plugin that is left out. On version 6 and below nothing changes; `stars info` and `stars doctor` now list the plugins registered by name. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#337](https://github.com/wolfstar-project/stars-components/pull/337) [`c2b1430`](https://github.com/wolfstar-project/stars-components/commit/c2b14303847ceb920d5bb93be8a6d4dcb1e26fa8) - Modules can run code in the bot at the client's lifecycle points. `hooks` in `defineModule` accepts `client:preGenericsInitialization`, `client:preInitialization`, `client:postInitialization`, `client:preLoad` and `client:postListen`, given by source (`{ from, export }`, a function called with `(client, clientOptions)`), and `ctx.addClientHook(name, source)` does the same from `setup`. The hooks of a module share one runtime plugin named after it. `ModulesRuntime` gains `clientHooks`, `stars info` lists them, and a bad hook fails with `MODULE_HOOK_INVALID`. Thanks [@RedStar071](https://github.com/RedStar071)!

- [#339](https://github.com/wolfstar-project/stars-components/pull/339) [`cda12c2`](https://github.com/wolfstar-project/stars-components/commit/cda12c27a2ccf313d78a84d55f9114228d0b1689) - Modules can add a directory of locales with `ctx.addLocales(directory)`. The directory is laid out as `<language>/<namespace>.json`, and its namespaces are read when the module is set up. A runtime plugin generated into the `\0stars:modules` source (and the `node --import` preload) merges it into the client's `i18n` option before `@wolfstar/plugin-i18next` builds its handler, keeping the project's own languages directory. `ModulesRuntime` gains `locales`, `stars info` lists them, and a bad directory fails with `MODULE_LOCALES_INVALID`. `@wolfstar/http-framework` now re-exports `getRootData` from `@sapphire/pieces`, which the generated plugin uses to find the default languages directory. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`b98cbef`](https://github.com/wolfstar-project/stars-components/commit/b98cbef7581c69d8e7493e2ad880f6785415b078), [`af4289e`](https://github.com/wolfstar-project/stars-components/commit/af4289eaaef37d8e1879bb1984997bffe74bf42c), [`c2b1430`](https://github.com/wolfstar-project/stars-components/commit/c2b14303847ceb920d5bb93be8a6d4dcb1e26fa8), [`cda12c2`](https://github.com/wolfstar-project/stars-components/commit/cda12c27a2ccf313d78a84d55f9114228d0b1689)]:
    - @wolfstar/schema@0.11.0

## 0.4.5

### Patch Changes

- Updated dependencies [[`a48c529`](https://github.com/wolfstar-project/stars-components/commit/a48c529cb049169080650d16405c9d639f1cd950), [`a69125a`](https://github.com/wolfstar-project/stars-components/commit/a69125ad7664462bc648a828f660d7361e95a265)]:
    - @wolfstar/schema@0.10.0

## 0.4.4

### Patch Changes

- Updated dependencies [[`d782e5d`](https://github.com/wolfstar-project/stars-components/commit/d782e5d94498f6b2b7216f0533895dd07a3ebf48), [`a5e09ae`](https://github.com/wolfstar-project/stars-components/commit/a5e09aec61803ed9defcfd0078217a30411e6c24)]:
    - @wolfstar/schema@0.9.0

## 0.4.3

### Patch Changes

- Updated dependencies [[`1e69874`](https://github.com/wolfstar-project/stars-components/commit/1e698742d1ec940e1cc310a66073af9ce406dddc)]:
    - @wolfstar/schema@0.8.0

## 0.4.2

### Patch Changes

- [#253](https://github.com/wolfstar-project/stars-components/pull/253) [`05a8443`](https://github.com/wolfstar-project/stars-components/commit/05a8443cf6ba64950c9e2fed5ebdd13c03b6cc06) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`05a8443`](https://github.com/wolfstar-project/stars-components/commit/05a8443cf6ba64950c9e2fed5ebdd13c03b6cc06), [`814c8f9`](https://github.com/wolfstar-project/stars-components/commit/814c8f9aed2b5b96150806f09886bac7b76de736)]:
    - @wolfstar/schema@0.7.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`46c6169`](https://github.com/wolfstar-project/stars-components/commit/46c616943363d3db39149a56a8e8e5bd55937b30), [`9374fb0`](https://github.com/wolfstar-project/stars-components/commit/9374fb0b50016ebfcdd28d0940cf8d1262adf85d)]:
    - @wolfstar/schema@0.6.0

## 0.4.0

### Minor Changes

- [#247](https://github.com/wolfstar-project/stars-components/pull/247) [`2d9bf55`](https://github.com/wolfstar-project/stars-components/commit/2d9bf55a29ee43503d415edc800fea4c5a313630) - Add `modules` to `stars.config`: a list of package names or `[name, options]` tuples, installed by the CLI with `@wolfstar/kit`'s `setupModules` before `config:resolved`. The resolved configuration gains `modules` and `runtime` (the runtime plugins and auto-import presets the modules contributed). Runtime plugins are registered in the bot through a `\0stars:modules` virtual module imported before the legacy `/register` imports, which skip packages listed in `modules`, and, for the `tsc` and `none` build tools, through a `node --import` preload in `stars dev` and a `.stars/modules.mjs` file written by `stars prepare` for production (`stars build`, `stars prepare` and `stars info` report a `MODULES_PRELOAD_REQUIRED` warning that points at it; it loads `env` first through `.stars/env.mjs`). A failing module is reported as a `MODULE_FAILED` diagnostic (exit code 2). Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`2d9bf55`](https://github.com/wolfstar-project/stars-components/commit/2d9bf55a29ee43503d415edc800fea4c5a313630)]:
    - @wolfstar/schema@0.5.0

## 0.3.0

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

### Patch Changes

- Updated dependencies [[`19e6bf6`](https://github.com/wolfstar-project/stars-components/commit/19e6bf62dfbf2dba11644d08bbc2570179f0c177)]:
    - @wolfstar/schema@0.4.0

## 0.2.4

### Patch Changes

- Updated dependencies [[`3aa572c`](https://github.com/wolfstar-project/stars-components/commit/3aa572c78006b3dffdba8ff804c781498fef6153)]:
    - @wolfstar/schema@0.3.0

## 0.2.3

### Patch Changes

- [#227](https://github.com/wolfstar-project/stars-components/pull/227) [`ae15eef`](https://github.com/wolfstar-project/stars-components/commit/ae15eef45d0f85c630b8563b5436b9cd6379e64d) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!
- Updated dependencies [[`ae15eef`](https://github.com/wolfstar-project/stars-components/commit/ae15eef45d0f85c630b8563b5436b9cd6379e64d)]:
    - @wolfstar/schema@0.2.1

## 0.2.2

### Patch Changes

- [#222](https://github.com/wolfstar-project/stars-components/pull/222) [`4c4138e`](https://github.com/wolfstar-project/stars-components/commit/4c4138e9e46012344b3b65b0e4ca94d70021bf5d) - fix: only auto-register installed `@wolfstar/plugin-*` packages that export a `/register` entrypoint, so library packages such as `@wolfstar/plugin-cache`, `@wolfstar/plugin-gateway` and `@wolfstar/plugin-sharder` no longer break `stars build`/`stars dev` ([#217](https://github.com/wolfstar-project/stars-components/issues/217)) Thanks [@RedStar071](https://github.com/RedStar071)!

## 0.2.1

### Patch Changes

- [#213](https://github.com/wolfstar-project/stars-components/pull/213) [`ad7a743`](https://github.com/wolfstar-project/stars-components/commit/ad7a74356b4bad6a1563687f2f05e4de2212f215) - fix(deps): update all non-major dependencies Thanks [@renovate](https://github.com/apps/renovate)!

## 0.2.0

### Minor Changes

- [#209](https://github.com/wolfstar-project/stars-components/pull/209) [`6d970e5`](https://github.com/wolfstar-project/stars-components/commit/6d970e5e3e93f5a229d3f49a33b494cbe698df41) - Extract optional Vite and Nitro builders into dedicated server packages, with a shared host context and builder lifecycle contract in schema. Preserve CLI configuration, lazy loading, project-local dependencies, and plugin registration. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`6d970e5`](https://github.com/wolfstar-project/stars-components/commit/6d970e5e3e93f5a229d3f49a33b494cbe698df41), [`6d970e5`](https://github.com/wolfstar-project/stars-components/commit/6d970e5e3e93f5a229d3f49a33b494cbe698df41)]:
    - @wolfstar/schema@0.2.0
