<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/prettier-config

**Shareable Prettier configuration for Star Network projects.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/prettier-config)](https://npmx.dev/package/@wolfstar/prettier-config)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/prettier-config)](https://npmx.dev/package/@wolfstar/prettier-config)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

`@wolfstar/oxfmt-config`'s formatting rules, translated to Prettier options, for consumers of `@wolfstar/*` packages who use Prettier instead of oxfmt: tabs with a width of 4, a print width of 150, single quotes, no trailing commas, semicolons and LF line endings.

This repo itself is **not** formatted with this config — it uses oxfmt directly. This package exists purely for external consumers.

## Installation

```bash
pnpm add -D prettier @wolfstar/prettier-config
```

## Usage

```typescript
// prettier.config.ts
import { createPrettierConfig } from '@wolfstar/prettier-config';

export default createPrettierConfig();
```

Pass overrides (including per-glob `overrides`) as the first argument; they are shallow-merged on top of the shared config.

## Buy us some doughnuts

Star Network is open source and always will be, even if we don't get donations. That being said, we know there are amazing people who may still want to donate just to show their appreciation. Thank you very much in advance!

## License

Apache-2.0
