# @wolfstar/kit

## 0.1.1

### Patch Changes

- Updated dependencies [[`46c6169`](https://github.com/wolfstar-project/stars-components/commit/46c616943363d3db39149a56a8e8e5bd55937b30), [`9374fb0`](https://github.com/wolfstar-project/stars-components/commit/9374fb0b50016ebfcdd28d0940cf8d1262adf85d)]:
    - @wolfstar/schema@0.6.0

## 0.1.0

### Minor Changes

- [#247](https://github.com/wolfstar-project/stars-components/pull/247) [`2d9bf55`](https://github.com/wolfstar-project/stars-components/commit/2d9bf55a29ee43503d415edc800fea4c5a313630) - New package: `defineModule` and the module runtime for installable Stars modules, the `@nuxt/kit` counterpart. A module declares `meta` (name, version, `compatibility` ranges checked against the project's `@wolfstar/http-framework` and `@wolfstar/cli`), `defaults`, `dependencies`, `hooks` and `setup(options, ctx)`, whose `ctx` offers `addPlugin`, `addImports`, `hook`, `callHook` and `installModule`. `setupModules` installs them once each, dependencies first, and failures are reported as `ModuleError`s. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`2d9bf55`](https://github.com/wolfstar-project/stars-components/commit/2d9bf55a29ee43503d415edc800fea4c5a313630)]:
    - @wolfstar/schema@0.5.0
