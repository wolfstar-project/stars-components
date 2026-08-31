<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/shared-http-pieces

**The shared commands and pieces used by Star Network's HTTP-only bots.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/shared-http-pieces)](https://npmx.dev/package/@wolfstar/shared-http-pieces)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/shared-http-pieces)](https://npmx.dev/package/@wolfstar/shared-http-pieces)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)
[![Tolgee](https://img.shields.io/badge/Localization-Tolgee-1D2A3A?style=flat-square&logo=tolgee&logoColor=white)](https://app.tolgee.io/projects/33773)

</div>

## Description

The shared commands used for Star Network's HTTP-only bots.

## Setup

- Define `locales/{{lng}}/commands/shared:infoEmbedDescription` as a string. This is the content displayed in `/info`'s embed description.
- Define the information variables.
- Importing `@wolfstar/shared-http-pieces/register` registers a `preGenericsInitialization` hook
  that adds this package's bundled locales to your `Client`'s i18n backend automatically — as long
  as it's imported before `new Client(...)`, no manual wiring is required. The resolved path is
  also exported as `localesPath`, if you need it directly.

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
