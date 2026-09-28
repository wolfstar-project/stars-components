<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/discord-utilities

**Library-agnostic Discord limits, regexes, and option resolvers for raw API payloads.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/discord-utilities)](https://npmx.dev/package/@wolfstar/discord-utilities)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/discord-utilities)](https://npmx.dev/package/@wolfstar/discord-utilities)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

`@wolfstar/discord-utilities` is a drop-in replacement for
[`@sapphire/discord-utilities`](https://npmx.dev/package/@sapphire/discord-utilities): the same exports (limits
namespaces, regexes, and raw-payload option resolvers), ported to work only on the raw Discord API — no dependency on
`discord.js`, `@discordjs/*`, or `@sapphire/*`. It has no runtime dependencies of its own, so it works equally well
from a gateway bot, an HTTP interactions bot, a worker, or a test suite.

Migrating from `@sapphire/discord-utilities` is an import-specifier change: every limits namespace, regex, and
resolver keeps its original name.

## Installation

```sh
pnpm add @wolfstar/discord-utilities discord-api-types
```

`discord-api-types` is a peer dependency.

## Usage

### Limits and regexes

```ts
import { MessageLimits, SnowflakeRegex } from '@wolfstar/discord-utilities';

function isValidContent(content: string): boolean {
	return content.length <= MessageLimits.MaximumLength;
}

function isSnowflake(value: string): boolean {
	return SnowflakeRegex.test(value);
}
```

### Option resolvers over a raw payload

```ts
import { ChatInputInteractionOptionResolver } from '@wolfstar/discord-utilities';
import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

function handle(interaction: APIChatInputApplicationCommandInteraction) {
	const options = new ChatInputInteractionOptionResolver(interaction);
	const user = options.getUser('user', true);
	const reason = options.getString('reason') ?? 'No reason provided';

	return { user, reason };
}
```

## License

Licensed under the Apache-2.0 license.

Portions ported from `@sapphire/discord-utilities`, © 2020 The Sapphire Community and its contributors, MIT
License — see `LICENSE-SAPPHIRE.md`.
