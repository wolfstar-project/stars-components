<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/oxfmt-config

**Shareable oxfmt base configuration for Star Network projects.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/oxfmt-config)](https://npmx.dev/package/@wolfstar/oxfmt-config)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/oxfmt-config)](https://npmx.dev/package/@wolfstar/oxfmt-config)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

The oxfmt formatting options used across `@wolfstar/*` projects: tabs with a width of 4, a print width of 150, single quotes, no trailing commas, semicolons and LF line endings.

It intentionally ships **no** `ignorePatterns`: those are project-specific and belong in your own config.

## Installation

```bash
pnpm add -D oxfmt @wolfstar/oxfmt-config
```

## Usage

oxfmt has no `extends` mechanism for `.oxfmtrc.json` yet ([oxc-project/oxc#16394](https://github.com/oxc-project/oxc/issues/16394)), so consume this package from an `oxfmt.config.ts` instead:

```typescript
import { defineConfig } from 'oxfmt';
import config from '@wolfstar/oxfmt-config' with { type: 'json' };

export default defineConfig({
	...config,
	ignorePatterns: ['**/dist/**']
});
```

oxfmt picks up `.oxfmtrc.json` before `oxfmt.config.ts`, and only one config file may exist per directory — remove any existing `.oxfmtrc.json` when switching to the TypeScript config, otherwise it silently keeps winning.

If you prefer plain JSON, copy the values out of this package's `index.json` into your own `.oxfmtrc.json`.

## Buy us some doughnuts

Star Network is open source and always will be, even if we don't get donations. That being said, we know there are amazing people who may still want to donate just to show their appreciation. Thank you very much in advance!

## License

Apache-2.0
