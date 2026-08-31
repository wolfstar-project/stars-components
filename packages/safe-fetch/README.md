<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/safe-fetch

**A fetch wrapper on top of Rust-style <code>Result</code>, so requests never throw.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/safe-fetch)](https://npmx.dev/package/@wolfstar/safe-fetch)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/safe-fetch)](https://npmx.dev/package/@wolfstar/safe-fetch)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

A fetch wrapper on top of Rust's Result, powered by [`@sapphire/result`](https://www.npmjs.com/package/@sapphire/result).

## Features

- Powered by the native `fetch` function
- CJS and ESM support

## Usage

```typescript
import { Json, safeFetch } from '@wolfstar/safe-fetch';

const result = await Json<{ id: number; name: string }>(safeFetch('https://api.example.org/users/1'));

result.match({
	ok: (user) => console.log(user.name),
	err: (error) => console.error(error)
});
```
