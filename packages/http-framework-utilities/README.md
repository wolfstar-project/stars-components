<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/http-framework-utilities

**Type guards, permission helpers, a message builder, paginated messages, and prompters for `@wolfstar/http-framework`.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/http-framework-utilities)](https://npmx.dev/package/@wolfstar/http-framework-utilities)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/http-framework-utilities)](https://npmx.dev/package/@wolfstar/http-framework-utilities)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

`@wolfstar/http-framework-utilities` is the `@wolfstar/http-framework` counterpart of
[`@sapphire/discord.js-utilities`](https://npmx.dev/package/@sapphire/discord.js-utilities): type guards over raw
channel/interaction payloads, `app_permissions`-based permission helpers, a `MessageBuilder`, a `PaginatedMessage`
(with lazy and embed-field variants), and a `MessagePrompter` — all built for HTTP interactions instead of a gateway
connection and its caches. It re-exports everything from `@wolfstar/discord-utilities`, so a single import covers
both packages.

## Installation

```sh
pnpm add @wolfstar/http-framework-utilities
```

`@wolfstar/http-framework` and `discord-api-types` are peer dependencies.

## Usage

### Type guards and permissions

```ts
import { canSendEmbeds, isTextBasedChannel } from '@wolfstar/http-framework-utilities';
import type { Interactions } from '@wolfstar/http-framework';

function canReplyWithEmbeds(interaction: Interactions.ApplicationCommand) {
	return isTextBasedChannel(interaction.channel) && canSendEmbeds(interaction);
}
```

`can*` helpers read the application's permissions from the interaction's `app_permissions`; there is no channel
cache to fall back on, so a helper that cannot decide from the payload returns `false` instead of throwing.

### `MessageBuilder`

```ts
import { MessageBuilder } from '@wolfstar/http-framework-utilities';

const body = new MessageBuilder()
	.setContent('Done!')
	.setEmbeds([{ title: 'Result' }])
	.toJSON();

await interaction.reply(body);
```

`toJSON()` validates the body against Discord's limits and throws a `RangeError` naming the offending field.
`MessageBuilder` has no `setFiles`: the framework's `reply`/`update` do not upload files, only `followup` does.

### `PaginatedMessage` inside a command

```ts
import { PaginatedMessage } from '@wolfstar/http-framework-utilities';

export function run(interaction: Interactions.ApplicationCommand) {
	return new PaginatedMessage()
		.addPageEmbed({ title: 'Page 1', description: 'First page' })
		.addPageEmbed({ title: 'Page 2', description: 'Second page' })
		.run(interaction);
}
```

`run` sends the first page and stores a session that the built-in `first`/`previous`/`next`/`last`/`stop`/`select`
buttons use to browse pages, later interaction clicks resolved by the package's own interaction handlers. Custom
`actions` must use ids other than those reserved built-in ones.

### `PaginatedFieldMessageEmbed`

```ts
import { PaginatedFieldMessageEmbed } from '@wolfstar/http-framework-utilities';

const message = new PaginatedFieldMessageEmbed<string>()
	.setTemplate({ color: 0x5865f2 })
	.setTitleField('Members')
	.setItems(memberNames)
	.formatItems((name, index) => `${index + 1}. ${name}`)
	.setItemsPerPage(10)
	.make();

await message.run(interaction);
```

`make()` builds the pages from the current items/formatter/items-per-page and replaces any pages added before it;
call it once the setters are configured.

### `MessagePrompter`

```ts
import { MessagePrompter } from '@wolfstar/http-framework-utilities';

const confirmed = await new MessagePrompter('Delete?').run(interaction);
if (confirmed) await interaction.followup({ content: 'Deleted' });
```

The reply to the button click is used to remove the prompt's buttons (an HTTP interaction gets exactly one
response), so any follow-up message for the user's answer must be sent with `followup`, not `reply`.

## Sessions and multiple processes

By default, `PaginatedMessage` and `MessagePrompter` sessions are kept in an in-memory `MemorySessionStore`, scoped
to the current process. If your bot runs several replicas behind a shared gateway/load balancer, a click may land on
a process that did not create the session. Use `setSessionStore` with a `RedisSessionStore` to share
`PaginatedMessage` sessions across processes:

```ts
import { RedisSessionStore, setSessionStore } from '@wolfstar/http-framework-utilities';
import Redis from 'ioredis';

setSessionStore(new RedisSessionStore({ redis: new Redis(process.env.REDIS_URL) }));
```

`RedisSessionStore` only needs `get`/`set(key, value, 'PX', ms)`/`del`, satisfied by an `ioredis` `Redis` or
`Cluster` instance without depending on `ioredis` itself.

When using a shared store, import the `/register` entrypoint before creating the client so every process registers
the interaction handlers at startup, instead of only the process that first calls `run`:

```ts
import '@wolfstar/http-framework-utilities/register';
```

Lazy pages, custom action `run` callbacks, and `MessagePrompter` sessions stay process-local even with a shared
store: their state includes functions, which are not JSON-serialisable. A `MessagePrompter`'s answer must reach the
process that called `run`; a multi-replica bot should prefer `PaginatedMessage`-style store-backed actions for
anything that must survive a click landing on a different process.

## Migrating from `@sapphire/discord.js-utilities`

- The `message` and `reaction` `MessagePrompter` strategies are not available: an HTTP interactions bot receives
  neither messages nor reactions, only interactions.
- Type guards take raw payloads (`APIChannel` / `APIInteractionDataResolvedChannel` / interaction structures)
  instead of discord.js class instances.
- `can*` permission helpers take the interaction (using its `app_permissions` bitfield) instead of a cached channel.
- `isMessageInstance` and `isGuildBasedChannelByGuildKey` are gone; they existed only for discord.js structures.
