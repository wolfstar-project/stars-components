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

## Setup

Import the `/register` entrypoint in your setup module, before constructing the client, so this package's
`wolfstar-pm` (paginated message) and `wolfstar-mp` (message prompter) interaction handlers are registered on every
process — not only the one that happens to call `PaginatedMessage#run` / `MessagePrompter#run` first:

```ts
import '@wolfstar/http-framework-utilities/register';
```

This import is **required**, including when building with the `stars` CLI: CLI auto-registration only discovers
`@wolfstar/plugin-*` packages, so it does not pick up `@wolfstar/http-framework-utilities` and this import cannot be
skipped.

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
`actions` with a `run` callback must use ids other than those reserved built-in ones (listed in
`PaginatedMessageBuiltinActionIds`): `addAction` throws a `TypeError` otherwise, since a click on a built-in id always
runs the built-in behaviour. An action with a built-in id and no `run` is allowed, to restyle a default button (e.g.
`{ id: 'next', type: 'button', emoji: { name: '👉' } }`).

Clicks on the same message are handled one at a time within a process, so two quick `next` clicks both apply. A
click that has to wait for a previous one is acknowledged at once with `deferUpdate` (so it cannot miss Discord's
3-second response deadline), then applied by editing the original response, with any notice sent as an ephemeral
`followup`. A custom action `run` on such a click receives an interaction that is already acknowledged
(`interaction.replied` is `true`): it must not `reply`/`update` it, only `followup`. `stop`
leaves a small `{ stopped: true }` tombstone in the store until the session would have expired, instead of deleting it:
a click that was already being handled (on this process or another replica) re-reads the session right before saving
and expires instead of bringing the stopped session back. If saving a click fails, the message keeps showing the page
it was on and the user gets an ephemeral notice asking them to try again, set process-wide with
`setDefaultSaveFailedReply` (default `DefaultSaveFailedReply`, `'Something went wrong, please try again.'`).

`run` always sends a fresh reply. For a deferred reply or a follow-up, call `start(ownerId)` instead: it creates the
session without sending anything and returns `{ sessionId, payload }`, so you send `payload` yourself:

```ts
export async function run(interaction: Interactions.ApplicationCommand) {
	await interaction.defer();

	const { payload } = await new PaginatedMessage().addPageEmbed({ title: 'Page 1' }).addPageEmbed({ title: 'Page 2' }).start(interaction.user.id);

	await interaction.followup(payload);
}
```

Pass `null` as `ownerId` to let anyone use the components even when `ownerOnly` is `true` (the default).

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

`run` resolves with the user's answer, or `null` when `timeout` (default `60_000` ms) elapses first. `timeout` must
be at most `MaximumTokenLifetime` (see below): a prompt always edits its own `'@original'` reply, so the interaction
token is its only edit credential. `MessagePrompter` requires a **process-scoped** session store — `run` throws a
`TypeError` before replying if the configured store's `scope` is `'shared'` — because the answer is delivered to an
in-process waiter in the process that called `run`; there is no way to move a pending answer to another process. See
[Session stores and process scope](#session-stores-and-process-scope) below.

### `flags` are not applied

`PaginatedMessage` and `MessagePrompter` only read `content` / `embeds` / `allowed_mentions` (and `components`, which
they render themselves) off a page or a `MessageBuilder`. `flags` set on a page object or via
`MessageBuilder#setFlags` — e.g. `MessageFlags.Ephemeral` — are dropped: neither `toPage` (used by `PaginatedMessage`)
nor `MessagePrompter#run` forward them to the interaction response. If you need an ephemeral paginated message or
prompt, pass `flags` in the `reply`/`update` call yourself instead of relying on the builder/page.

## Session stores and process scope

By default, `PaginatedMessage` sessions are kept in an in-memory `MemorySessionStore`, scoped to the current
process (`scope: 'process'`). If your bot runs several replicas behind a shared gateway/load balancer, a click may
land on a process that did not create the session. Use `setSessionStore` with a `RedisSessionStore`
(`scope: 'shared'`) to share `PaginatedMessage` sessions across processes:

```ts
import { RedisSessionStore, setSessionStore } from '@wolfstar/http-framework-utilities';
import Redis from 'ioredis';

setSessionStore(new RedisSessionStore({ redis: new Redis(process.env.REDIS_URL) }));
```

`setSessionStore` configures the store used process-wide by anything that does not pass its own `store` option.
Passing `store` to a `PaginatedMessage` instance only tells the process that called `run`/`start` where the session
lives. A click reaching a different process looks the session up in its default store (its own `setSessionStore` call,
or the default `MemorySessionStore`), then in every store registered with `registerSessionStore` — so a per-instance
shared `store` must be registered on **every** replica, or the click expires there:

```ts
import { registerSessionStore, RedisSessionStore } from '@wolfstar/http-framework-utilities';

export const menuStore = new RedisSessionStore({ redis, prefix: 'menus' });
registerSessionStore(menuStore); // at startup, on every replica

new PaginatedMessage({ store: menuStore }); // later, on any replica
```

Configuring the shared store globally with `setSessionStore` needs no registration.

Across replicas, a shared store is last-write-wins for simultaneous clicks on the same message: two replicas handling
a click at the same moment both read the same page and the later save wins. The re-read before saving narrows the
window in which a click can undo a `stop`, but cannot close it without atomic store operations.

`RedisSessionStore` only needs `get`/`set(key, value, 'PX', ms)`/`del`, satisfied by an `ioredis` `Redis` or
`Cluster` instance without depending on `ioredis` itself.

When using a shared store, the [`/register`](#setup) import matters for every process, not just the one that
replies: a click can land on a process that never called `run`, and only a process whose handlers are registered can
answer it.

### What a shared store rejects

A shared store only holds JSON-serialisable, eager pagination state. Before replying, `PaginatedMessage#run` /
`#start` (via `assertSharedSessionState`) throws a `TypeError` naming the offending field for anything a shared
store cannot carry between processes:

- Lazy page functions (unresolved pages) — use eager pages (`addPage`/`addPageEmbed`/… with a value, not a
  function) with a shared store.
- Custom action `run` callbacks — only reserved built-in action ids (`first`, `previous`, `next`, `last`, `stop`,
  `select`) are supported with a shared store.
- Values that do not survive a JSON round trip: functions, symbols, `bigint`s, `NaN`/`Infinity`, class instances
  other than plain objects/arrays, and circular references.

`MessagePrompter` rejects a shared store outright (see above): it requires a process-scoped store regardless of
what its message/strategy look like, because its answer is never written to the store at all. A bot whose default
store is shared can still prompt by passing a process-scoped store to the prompter, provided its load balancer routes
the click back to the process that called `run` (sticky routing):

```ts
import { MemorySessionStore, MessagePrompter } from '@wolfstar/http-framework-utilities';

const confirmed = await new MessagePrompter('Delete?', 'confirm', { store: new MemorySessionStore() }).run(interaction);
```

A multi-replica bot should prefer store-backed, eager-page `PaginatedMessage`s (no `run` callback, no lazy pages)
over `MessagePrompter` for anything that must survive a click landing on a different process.

## Timeout cleanup

`PaginatedMessage#run` and `MessagePrompter#run` schedule a best-effort cleanup of the message's controls when the
session times out (`idle` for `PaginatedMessage`, `timeout` for `MessagePrompter`). `start(ownerId)` flows send
their own payload and have no timeout cleanup — only `run` schedules one; a later click on a `start`-created session
still goes through the expired-session handling below.

- `timeoutBehavior: 'disable' | 'remove'` (default `'disable'`) controls what the cleanup does to the message's
  components: `'disable'` greys every button/select out, `'remove'` deletes the action rows. `stop` always disables,
  regardless of `timeoutBehavior`.
- `MaximumTokenLifetime` (14 minutes) bounds sessions whose only edit credential is the interaction token —
  ephemeral replies, or a reply with no channel id. `idle`/`timeout` above that bound throws a `RangeError` for
  those cases. Discord's interaction token itself lives for `InteractionTokenLifetime` (15 minutes); the one-minute
  gap is the margin used for the timeout edit itself.
- For a **non-ephemeral** `PaginatedMessage#run` reply, an `idle` above `MaximumTokenLifetime` is allowed: `run`
  fetches the real message id after replying, and cleanup after the interaction token expires falls back to the
  bot's own `container.rest` credentials on `Routes.channelMessage(channelId, messageId)` instead of the (by then
  expired) webhook token. That late edit needs the bot itself to access the channel: for a user-installed app, or a
  guild the bot is not in, it fails, is logged, and the controls stay visible (cleanup is best effort).
- `MessagePrompter#run`'s `timeout` always caps at `MaximumTokenLifetime`: a prompt always edits its `'@original'`
  reply, so it never gets the non-ephemeral bot-REST fallback above.
- Cleanup is **best effort**: process shutdown, serverless suspension, missing permissions, or API failures can
  leave expired controls visible. It never persists or logs interaction tokens — they live only in an in-process
  cleanup registry, independent of any `SessionStore`.

## Expired or unknown sessions

When a click's session is missing, expired, or otherwise unresolvable, the built-in handlers `update` the clicked
message with every one of its components disabled, then send an ephemeral `followup` with the expiry notice —
matching the rule that an HTTP interaction gets exactly one direct response (`update`), with the notice going out
as a `followup` instead. The notice defaults to `DefaultExpiredReply` (`'This interaction has expired.'`).

An expired or unknown session cannot be read anymore, so nothing per instance is known when its click arrives: its
notice is process-wide. Set it once at startup with `setDefaultExpiredReply` (and read it with
`getDefaultExpiredReply`); it applies to both paginated messages and prompters:

```ts
import { setDefaultExpiredReply } from '@wolfstar/http-framework-utilities';

setDefaultExpiredReply('This menu is no longer available.');
```

`PaginatedMessage` also takes an `expiredReply` option (or `setExpiredReply`), defaulting to the process-wide notice.
It only applies while the session is still readable, when a click cannot be handled by this process — e.g. a custom
action or a lazy page that only exists on the process that started the message. For real expiry, use
`setDefaultExpiredReply`. `MessagePrompter` has no `expiredReply` option: a prompt that expired is always unknown.

## Gateway (`@wolfstar/plugin-gateway`)

The `@wolfstar/http-framework-utilities/gateway` subpath adds the gateway-only parts of
`@sapphire/discord.js-utilities`, built on [`@wolfstar/plugin-gateway`](https://npmx.dev/package/@wolfstar/plugin-gateway)
structures. It is optional: the main entrypoint never imports it.

```sh
pnpm add @wolfstar/plugin-gateway
```

`@wolfstar/plugin-gateway` (`^0.8.0`) is an optional peer dependency and requires Node `>=24.17`. Gateway bots must still
serve their HTTP interactions endpoint (`GatewayClient.start({ listen })`), because button and select clicks arrive as
interactions, and must import [`@wolfstar/http-framework-utilities/register`](#setup) like an HTTP bot.

### Type guards

`isTextBasedChannel`, `isGuildBasedChannel`, `isThreadChannel`, `isVoiceBasedChannel`, `isNsfwChannel`,
`isMessageInstance`, `isGuildMember`, and the per-type guards (`isTextChannel`, `isDMChannel`, `isNewsChannel`, ...)
take `@wolfstar/plugin-gateway` structures instead of raw payloads.

### Permissions

The async `can*` helpers compute the bot's permissions in a channel structure, and resolve `false` when they cannot
(no channel, no bot user yet, no gateway client, a failed fetch). DMs resolve `true`, except `canRemoveAllReactions` and
`canJoinVoiceChannel`, which resolve `false`.

```ts
import { canReact, canSendEmbeds } from '@wolfstar/http-framework-utilities/gateway';

if (await canSendEmbeds(message.channel)) await message.reply({ embeds: [{ title: 'Hello' }] });
```

Available helpers: `canReadMessages`, `canSendMessages`, `canSendEmbeds`, `canSendAttachments`, `canReact`,
`canRemoveAllReactions`, `canJoinVoiceChannel`.

### Collectors

`awaitMessages(channel, { time, max, filter })` and `awaitReactions(message, { time, max, filter })` resolve with what
they collected once `max` (default `1`) values pass `filter` or `time` (milliseconds, required) elapses. `time` and `max`
must be positive integers, and they reject without a `GatewayClient`. Filters run concurrently as events arrive, but
results are committed in arrival order: with `max: 1`, the first qualifying event by arrival wins once it and every
earlier event have a decided filter result. When `time` elapses, every event whose filter already passed is returned,
in arrival order (events still being filtered are dropped).

`awaitReactions` collects `{ reaction, user, userId }`. `user` is `null` when `@wolfstar/plugin-gateway` knows the user
neither from the payload nor from its cache (e.g. DMs without a user cache), so filter on `userId`, which is always set.

```ts
import { awaitMessages } from '@wolfstar/http-framework-utilities/gateway';

const [answer] = await awaitMessages(message.channel, {
	time: 30_000,
	filter: (candidate) => candidate.author.id === message.author.id
});
```

### `GatewayPaginatedMessage`

A `PaginatedMessage` whose `run(target, author?)` also accepts a gateway `Message` (replied to) or a text-based channel
(sent to), besides an HTTP interaction. `author` is the user allowed to use the controls: it defaults to the message's
author for a `Message`, and to anyone for a channel; it is ignored for an interaction.

```ts
import { GatewayPaginatedMessage } from '@wolfstar/http-framework-utilities/gateway';

await new GatewayPaginatedMessage().addPageEmbed({ title: 'Page 1' }).addPageEmbed({ title: 'Page 2' }).run(message);
```

Gateway targets are bot-owned, non-ephemeral messages, so their timeout cleanup edits them through the bot's REST
credentials and `idle` may exceed `MaximumTokenLifetime`.

### `GatewayMessagePrompter`

A `MessagePrompter` with two more strategies, and `run(target, author?)` accepting the same targets. `author` defaults to
the interaction's user or the message's author, and is **required** for a channel target. `run` resolves with the answer,
or `null` when `timeout` (default 60 seconds) elapses.

| Strategy   | Resolves with                                  | Required intents (guild / DM)                                            |
| ---------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `confirm`  | `boolean`, from yes/no buttons                 | none                                                                     |
| `number`   | `number`, from numbered buttons                | none                                                                     |
| `message`  | the author's next `Message` in the channel     | `GuildMessages` + `MessageContent` / `DirectMessages` + `MessageContent` |
| `reaction` | the chosen entry of `reactions`, as configured | `GuildMessageReactions` / `DirectMessageReactions`                       |

The `message` and `reaction` strategies throw before sending when the gateway client lacks their intents. `reaction`
reacts with `reactions` (default `['✅', '❌']`; Unicode emojis or custom ones as `name:id`) in order and matches a
reaction by the custom emoji's id, else by the Unicode emoji. Unicode matching is exact, variation selectors included:
`'❤'` and `'❤️'` (with `U+FE0F`) are different entries, so configure the form Discord sends for the emoji.

```ts
import { GatewayMessagePrompter } from '@wolfstar/http-framework-utilities/gateway';

const confirmed = await new GatewayMessagePrompter('Delete this?', 'confirm').run(message);

const reply = await new GatewayMessagePrompter('What is your name?', 'message', { timeout: 30_000 }).run(channel, message.author);

const choice = await new GatewayMessagePrompter('Proceed?', 'reaction', { reactions: ['✅', '❌'] }).run(message);
```

On gateway targets the button strategies' timeout is not bound by `MaximumTokenLifetime`; on an HTTP interaction it is,
for every strategy — including `message` and `reaction`, whose question is the interaction's reply and so is only
editable with the interaction token. `timeout` must be a positive integer, and at most 2^31 − 1 ms for `message` and
`reaction`. Like `MessagePrompter`, every strategy needs a process-scoped session store.

## Migrating from `@sapphire/discord.js-utilities`

- The `message` and `reaction` `MessagePrompter` strategies are not available on the main entrypoint: an HTTP
  interactions bot receives neither messages nor reactions. They are in [`GatewayMessagePrompter`](#gatewaymessageprompter).
- Type guards take raw payloads (`APIChannel` / `APIInteractionDataResolvedChannel` / interaction structures)
  instead of discord.js class instances.
- `can*` permission helpers take the interaction (using its `app_permissions` bitfield) instead of a cached channel.
- `isMessageInstance` and `isGuildBasedChannelByGuildKey` are gone; they existed only for discord.js structures.
