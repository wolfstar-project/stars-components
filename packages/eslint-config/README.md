<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/eslint-config

**Shareable ESLint flat configuration for Star Network projects.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/eslint-config)](https://npmx.dev/package/@wolfstar/eslint-config)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/eslint-config)](https://npmx.dev/package/@wolfstar/eslint-config)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

`@wolfstar/oxlint-config`'s rule set, translated to ESLint flat config, for consumers of `@wolfstar/*` packages who use ESLint/Prettier instead of oxlint/oxfmt. Bundles `typescript-eslint`'s type-checked recommended rules, the same promise-safety rules as the oxlint config, [`@wolfstar/eslint-plugin-http-framework`](../eslint-plugin-http-framework) for framework/plugin-specific mistakes, and `eslint-config-prettier` to disable stylistic rules that would fight Prettier.

This repo itself is **not** linted with this config — it uses oxlint/oxfmt directly. This package exists purely for external consumers.

## Installation

```bash
pnpm add -D eslint typescript @wolfstar/eslint-config
```

## Usage

```typescript
// eslint.config.ts
import { createConfig } from '@wolfstar/eslint-config';

export default createConfig({ tsconfigRootDir: import.meta.dirname });
```

`tsconfigRootDir` is required — type-aware linting resolves your `tsconfig.json` from it. `ignores` and `typeChecked` can be overridden; see [`CreateConfigOptions`](./src/index.ts).

## Buy us some doughnuts

Star Network is open source and always will be, even if we don't get donations. That being said, we know there are amazing people who may still want to donate just to show their appreciation. Thank you very much in advance!

## License

Apache-2.0
