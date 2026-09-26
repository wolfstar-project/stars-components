# @wolfstar/vite-server

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
