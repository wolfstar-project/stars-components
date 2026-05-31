# `@wolfstar/logger`

A lightweight logger system with level support.

## Features

-   Logging integration similar to @sapphire/plugin-logger.
    -   Log levels
    -   Colorette powered Colours
    -   Timestamps
    -   Logging similar to framework (registering commands, errors, successes, etc)

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
