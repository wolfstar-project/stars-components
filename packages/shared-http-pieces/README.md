# `@wolfstar/shared-http-pieces` [![Tolgee](https://img.shields.io/badge/Localization-Tolgee-1D2A3A?logo=tolgee&logoColor=white)](https://app.tolgee.io/projects/33773)

The shared commands used for Star Network's HTTP-only bots.

## Setup

- Define `locales/{{lng}}/commands/shared:infoEmbedDescription` as a string. This is the content displayed in `/info`'s embed description.
- Define the information variables.
- Add this package's bundled locales to your `Client`'s i18n backend, otherwise `commands/shared:*`
  strings (including `/info`) fall back to their raw keys:

    ```typescript
    import { localesPath } from '@wolfstar/shared-http-pieces/register';
    import { Client } from '@wolfstar/http-framework';

    const client = new Client({
    	i18n: {
    		backend: { paths: [localesPath] }
    	}
    });
    ```

## Usage

You can either register after setting environment parameters:

```typescript
process.env.CLIENT_REPOSITORY = 'https://github.com/wolfstar-project/wolfstar';
process.env.CLIENT_INVITE =
	'https://discord.com/oauth2/authorize?client_id=266624760782258186&permissions=534185897078&scope=bot%20applications.commands';

import '@wolfstar/shared-http-pieces/register';
```

Or import its utilities as well as registering:

```typescript
import { setRepository, setInvite } from '@wolfstar/shared-http-pieces';
import '@wolfstar/shared-http-pieces/register';

setRepository('wolfstar'); // setRepository('https://github.com/wolfstar-project/wolfstar');
setInvite('266624760782258186', '534185897078');
```

Furthermore, error handling can be enabled by setting the `SENTRY_DSN`, `@wolfstar/shared-http-pieces` includes a way to register [Sentry](https://docs.sentry.io) and registers handlers to handle errors into Sentry. The plugin also reads `SENTRY_ROOT` to set [`RewriteFrames`](https://docs.sentry.io/platforms/node/configuration/integrations/pluggable-integrations/#rewriteframes)'s root, defaults to `process.cwd()`.
