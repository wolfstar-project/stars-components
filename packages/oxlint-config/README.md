<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/oxlint-config

**Shareable oxlint base configuration for Star Network projects.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/oxlint-config)](https://npmx.dev/package/@wolfstar/oxlint-config)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/oxlint-config)](https://npmx.dev/package/@wolfstar/oxlint-config)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

The oxlint rule set used across `@wolfstar/*` projects, published so downstream projects can reuse it instead of copying the rules by hand. It enables the type-aware promise rules (`no-floating-promises`, `no-misused-promises`, `await-thenable`, `return-await`, `require-await`), turns off the type rules that are noisy in this codebase style, and loads [`@wolfstar/eslint-plugin-http-framework`](../eslint-plugin-http-framework) as a `jsPlugins` entry for `@wolfstar/http-framework`/`@wolfstar/plugin-*` consumers.

It intentionally ships **no** `ignorePatterns`: those are project-specific and belong in your own config.

> [!NOTE]
> oxlint's `extends` merge behaviour for `jsPlugins` isn't documented as precisely as it is for `rules`. If, after extending this config, `wolfstar/*` rules don't appear to run, declare `jsPlugins` and the `wolfstar/*` entries directly in your own `.oxlintrc.json` (see [`@wolfstar/eslint-plugin-http-framework`](../eslint-plugin-http-framework) for the full rule list) instead of relying on `extends` to carry them over.

## Installation

```bash
pnpm add -D oxlint @wolfstar/oxlint-config
```

## Usage

In your project's `.oxlintrc.json`:

```json
{
	"$schema": "./node_modules/oxlint/configuration_schema.json",
	"extends": ["./node_modules/@wolfstar/oxlint-config/.oxlintrc.json"],
	"ignorePatterns": ["**/dist/**", "**/node_modules/**"]
}
```

oxlint resolves `extends` entries as **file paths** relative to the config file that declares them — bare package specifiers such as `"@wolfstar/oxlint-config"` are not supported. Rules declared in your own config are merged last and therefore win over the base.

## Buy us some doughnuts

Star Network is open source and always will be, even if we don't get donations. That being said, we know there are amazing people who may still want to donate just to show their appreciation. Thank you very much in advance!

## License

Apache-2.0
