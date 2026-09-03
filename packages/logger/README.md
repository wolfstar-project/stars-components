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
> **This package is deprecated.** It will be replaced by `@wolfstar/plugin-logger`, a future official plugin
> living in [`wolfstar-project/plugins`](https://github.com/wolfstar-project/plugins). The new package does not
> exist yet — only a proposed issue does — so there is nothing to migrate to today; see
> [Migration](#migration) below for details.

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

`@wolfstar/logger` is deprecated in favour of the future `@wolfstar/plugin-logger`, which will live in the
[`wolfstar-project/plugins`](https://github.com/wolfstar-project/plugins) repository alongside the other
`@wolfstar/plugin-*` packages. It is not implemented yet — at this stage only a proposed issue exists in that
repository — so there is no package to install and no migration steps to follow today.

The plan for `@wolfstar/plugin-logger` is to offer interchangeable adapters/backends (`evlog`, `consola`,
`winston`) behind pluggable transports, with optional Sentry integration, while keeping an API compatible in
style with the current `Logger` class (`trace`/`debug`/`info`/`warn`/`error`/`fatal`).

In the meantime, `@wolfstar/logger` remains fully functional and will **not** be removed until the migration
path to `@wolfstar/plugin-logger` is ready. This README will be updated with concrete migration steps once that
package is published.
