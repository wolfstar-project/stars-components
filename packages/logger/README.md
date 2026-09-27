<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/logger

**A lightweight logger system with level-based filtering and coloured output.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/logger)](https://npmx.dev/package/@wolfstar/logger)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/logger)](https://npmx.dev/package/@wolfstar/logger)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

> [!WARNING]
> **This package is deprecated** in favour of [`@wolfstar/plugin-logger`](https://www.npmjs.com/package/@wolfstar/plugin-logger),
> published from [`wolfstar-project/plugins`](https://github.com/wolfstar-project/plugins). See
> [Migration](#migration) below.

## Description

A lightweight logger system with level support.

## Features

- Logging integration similar to @sapphire/plugin-logger.
    - Log levels
    - Colorette powered Colours
    - Timestamps
    - Logging similar to framework (registering commands, errors, successes, etc)

## Usage

```typescript
import { Logger } from '@wolfstar/logger';

const logger = new Logger();

logger.info('Hello world');
// [2022/08/04-13:28:58] INFO (19284): Hello World

logger.info('Hello, %s', 'Wolfstar');
// [2022/08/04-13:29:46] INFO (19284): Hello, Wolfstar
```

For ease of use, `@wolfstar/logger` re-exports all the functions from [`colorette`](https://www.npmjs.com/package/colorette).

## Migration

`@wolfstar/logger` is deprecated in favour of
[`@wolfstar/plugin-logger`](https://www.npmjs.com/package/@wolfstar/plugin-logger), which replaces the built-in
`container.logger` of `@wolfstar/http-framework` with a pluggable logger (console, Sentry, and optional
`consola`/`evlog`/`winston` transports). It implements the framework's `ILogger` contract, so code logging
through `container.logger` (`trace`/`debug`/`info`/`warn`/`error`/`fatal`) keeps working unchanged.

1. Install it: `pnpm add @wolfstar/plugin-logger`, and remove `@wolfstar/logger`.
2. Register it before creating your `Client`. Projects built with the `stars` CLI register installed
   `@wolfstar/plugin-*` packages automatically; otherwise add `import '@wolfstar/plugin-logger/register';` to your
   entry point.
3. Replace direct `Logger` instances from `@wolfstar/logger` with `container.logger`, and pick transports as
   described in the [`@wolfstar/plugin-logger` README](https://github.com/wolfstar-project/plugins/tree/main/packages/plugin-logger#readme).

`@wolfstar/logger` stays installable but is no longer developed; new logging features land in `@wolfstar/plugin-logger`.
