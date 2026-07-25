---
title: Environment variables
description: Load and parse typed environment variables with @wolfstar/env-utilities.
---

# Environment variables

`@wolfstar/env-utilities` loads layered dotenv files and provides strict parsers for application configuration.

## Load dotenv files

Use the side-effect entry point when the default `.env` path is enough:

```typescript
import '@wolfstar/env-utilities/setup';
```

For an explicit path or custom options, call `setup`:

```typescript
import { setup } from '@wolfstar/env-utilities';

setup(new URL('../../.env', import.meta.url));
```

The loader applies environment-specific files with the most specific value first:

```text
.env.development.local → .env.local → .env.development → .env
.env.test.local        → .env.test                    → .env
```

`.env.local` is intentionally skipped in the test environment.

## Type application keys

Augment the package's `Env` interface so parsers accept your keys:

```typescript
import type { BooleanString, IntegerString } from '@wolfstar/env-utilities';

declare module '@wolfstar/env-utilities' {
	interface Env {
		ENABLE_TELEMETRY: BooleanString;
		HTTP_PORT: IntegerString;
		DISCORD_TOKEN: string;
	}
}
```

## Parse values

```typescript
import { envParseBoolean, envParseInteger, envParseString } from '@wolfstar/env-utilities';

const telemetryEnabled = envParseBoolean('ENABLE_TELEMETRY', false);
const port = envParseInteger('HTTP_PORT', 3000);
const discordToken = envParseString('DISCORD_TOKEN');
```

Missing required keys throw `ReferenceError`. Invalid values throw `TypeError`. A provided default is returned as-is.

## Configure the loader itself

You can set `DOTENV_PATH`, `DOTENV_ENV`, `DOTENV_PREFIX`, `DOTENV_ENCODING`, and `DOTENV_DEBUG` before setup. Keep secrets
outside source control and configure them through your deployment platform.
