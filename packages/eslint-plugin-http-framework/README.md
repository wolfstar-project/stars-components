<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/eslint-plugin-http-framework

**Custom lint rules for `@wolfstar/http-framework` and the `@wolfstar/plugin-*` ecosystem.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/eslint-plugin-http-framework)](https://npmx.dev/package/@wolfstar/eslint-plugin-http-framework)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/eslint-plugin-http-framework)](https://npmx.dev/package/@wolfstar/eslint-plugin-http-framework)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

A plugin catching misuse of `@wolfstar/http-framework` decorators and the `@wolfstar/plugin-*` ecosystem that TypeScript can't catch on its own. Each rule is grounded in a real trap documented or found in this framework's own source — see the doc block of each rule under [`src/rules`](./src/rules).

The plugin object is the standard ESLint plugin shape (`{ meta, rules: { name: { meta, create(context) {...} } } }`), which oxlint's JS plugin API is compatible with. One implementation, usable from both tools.

## Rules

| Rule                                         | Description                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `wolfstar/apply-options-decorator-order`     | `@ApplyOptions` must be the outermost decorator, above registration decorators                      |
| `wolfstar/require-subcommand-parent`         | `@RegisterSubcommand`/`@RegisterSubcommandGroup` requires `@RegisterCommand` on the same class      |
| `wolfstar/no-raw-discord-fetch`              | ban calling the Discord API directly instead of `container.rest`                                    |
| `wolfstar/no-dynamic-translation-key`        | i18next translation keys must be string literals                                                    |
| `wolfstar/prefer-apply-localized-builder`    | use `applyLocalizedBuilder` instead of raw `setName`/`setDescription` in i18n modules               |
| `wolfstar/no-hoisted-plugin-register-import` | a static `@wolfstar/plugin-*/register` import must not be hoisted above the module's own hook setup |
| `wolfstar/no-deprecated-i18n-package`        | ban imports of the deprecated `@wolfstar/http-framework-i18n`                                       |

Not covered (would need cross-file/directory scanning, higher false-positive risk, left as future work): a piece registered via `container.stores.loadPiece(...)` that's never imported by its directory's `_load.ts`, and a piece class that's never registered at all.

## Installation

```bash
pnpm add -D @wolfstar/eslint-plugin-http-framework
```

## Usage

### With `@wolfstar/eslint-config`

Already wired in — `createConfig()` enables every rule as `error`.

### Standalone, with ESLint

```typescript
import wolfstar, { recommendedRules } from '@wolfstar/eslint-plugin-http-framework';

export default [
	{
		plugins: { wolfstar },
		rules: recommendedRules
	}
];
```

### Standalone, with oxlint

```json
{
	"jsPlugins": ["@wolfstar/eslint-plugin-http-framework"],
	"rules": {
		"wolfstar/apply-options-decorator-order": "error",
		"wolfstar/require-subcommand-parent": "error",
		"wolfstar/no-raw-discord-fetch": "error",
		"wolfstar/no-dynamic-translation-key": "error",
		"wolfstar/prefer-apply-localized-builder": "error",
		"wolfstar/no-hoisted-plugin-register-import": "error",
		"wolfstar/no-deprecated-i18n-package": "error"
	}
}
```

## Buy us some doughnuts

Star Network is open source and always will be, even if we don't get donations. That being said, we know there are amazing people who may still want to donate just to show their appreciation. Thank you very much in advance!

## License

Apache-2.0
