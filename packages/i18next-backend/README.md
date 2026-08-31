<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/i18next-backend

**A fast and modern filesystem-based i18next backend for Node.js.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/i18next-backend)](https://npmx.dev/package/@wolfstar/i18next-backend)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/i18next-backend)](https://npmx.dev/package/@wolfstar/i18next-backend)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

A fast and modern filesystem-based [`i18next`](https://www.npmjs.com/package/i18next) backend for Node.js.

## Installation

You can use the following command to install this package, or replace `npm install` with your package
manager of choice.

```sh
npm install @wolfstar/i18next-backend i18next
```

## Usage

```typescript
import { Backend } from '@wolfstar/i18next-backend';
import i18next from 'i18next';

i18next.use(Backend);

await i18next.init({
	backend: {
		paths: [
			// Using a string:
			'/locales/{{lng}}/{{ns}}.json',
			// Using an URL:
			new URL('/locales/{{lng}}/{{ns}}.json', import.meta.url),
			// Using a function:
			(lng, ns) => `/locales/${lng}/${ns}.json`
		]
	}
	// ... i18next options
});
```
