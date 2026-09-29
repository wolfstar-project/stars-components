# Discord utilities for `@wolfstar/http-framework` — design

Date: 2026-09-28
Status: implemented

## Goal

Provide the `@wolfstar` counterparts of
[`@sapphire/discord-utilities`](https://npmx.dev/package/@sapphire/discord-utilities) and
[`@sapphire/discord.js-utilities`](https://npmx.dev/package/@sapphire/discord.js-utilities), so that bots built on
`@wolfstar/http-framework` (and later on `@wolfstar/plugin-gateway`) get limits, regexes, option resolvers, type
guards, permission helpers, a message builder, paginated messages, and prompters without depending on discord.js.

## Packages

Two new publishable packages in this repository, under `packages/`, each versioned independently through
Changesets and scaffolded like `packages/start-banner` (`tsdown`, `golar`, `vitest`), inheriting the repository-root
`oxlint` and `oxfmt` configuration.

### `@wolfstar/discord-utilities` (`packages/discord-utilities`)

- Library-agnostic: works on raw Discord API data only. No runtime dependency on `@wolfstar/http-framework`,
  `@discordjs/*`, or `@sapphire/*`.
- `discord-api-types` is a peer dependency (it is a dependency of `@sapphire/discord-utilities`; a peer avoids two
  copies of the enums in consumers).
- Own source, not a re-export of `@sapphire/discord-utilities`. Limits and regex names follow Sapphire's API;
  resolver names target `@sapphire/discord-utilities` **4.x**. This is not a drop-in replacement for 3.x's
  `InteractionOptionResolver` or its `RequiredIf` / `If` type helpers. Migrating resolvers requires selecting the
  class for each interaction kind, not just changing the import specifier.
- Contents:
    - Limits: `ChannelLimits`, `VoiceChannelLimits`, `StageChannelLimits`, `TextChannelLimits`, `ThreadLimits`,
      `EmbedLimits`, `EmojiLimits`, `GuildLimits`, `PremiumGuildLimits`, `GuildScheduledEventLimits`,
      `GuildMemberLimits`, `GuildBansLimits`, `InteractionLimits`, `ApplicationCommandLimits`,
      `ApplicationCommandOptionLimits`, `ApplicationCommandPermissionLimits`, `ButtonLimits`, `SelectMenuLimits`,
      `MessageLimits`, `ReactionLimits`, `ModerationLimits`, `RoleLimits`, `UserLimits`, `AutoCompleteLimits`,
      `ModalLimits`, `TextInputLimits`, `ApplicationRoleConnectionLimits`, `GuildAuditLogsLimits`,
      `AutoModerationRuleLimits`, `TriggerTypeLimits`, `TriggerMetadataLimits`, `ActionMetadataLimits`,
      `AllowedMentionsLimits`, `ChannelInviteLimits`, `GuildIntegrationLimits`, `StickerLimits`. Values are checked
      against the current Discord documentation, not copied blindly.
    - Regexes: `ChannelMentionRegex`, `ChannelMessageRegex`, `DiscordHostnameRegex`, `DiscordInviteLinkRegex`,
      `EmojiRegex`, `FormattedCustomEmoji`, `FormattedCustomEmojiWithGroups`, `HttpUrlRegex`, `MessageLinkRegex`,
      `ParsedCustomEmoji`, `ParsedCustomEmojiWithGroups`, `RoleMentionRegex`, `SnowflakeRegex`, `TokenRegex`,
      `UserOrMemberMentionRegex`, `WebSocketUrlRegex`, `WebhookRegex`, `TwemojiRegex`, `createTwemojiRegex()`.
    - Option resolvers over raw interaction payloads: `ChatInputInteractionOptionResolver`,
      `ContextMenuInteractionOptionResolver`, `AutocompleteInteractionOptionResolver`, `ModalInteractionOptionResolver`.
      These are separate from the framework's own resolvers in
      `packages/http-framework/src/lib/interactions/resolvers`, which stay unchanged; they exist for code that handles
      raw `APIInteraction` objects (gateway, workers, tests). When migrating from 3.x, chat-input option access
      moves to `ChatInputInteractionOptionResolver`, `getTargetUser` / `getTargetMember` / `getTargetMessage` to
      `ContextMenuInteractionOptionResolver`, and `getFocusedOption` to `AutocompleteInteractionOptionResolver`.
      `ModalInteractionOptionResolver` covers modal inputs; there is no legacy resolver compatibility alias.
- The future `@wolfstar/plugin-gateway-utilities` depends on this package unchanged.

### `@wolfstar/http-framework-utilities` (`packages/http-framework-utilities`)

- Dependency: `@wolfstar/discord-utilities` (workspace). Pieces APIs come from `@wolfstar/http-framework`, which re-exports `@sapphire/pieces`.
- Peer dependencies: `@wolfstar/http-framework`, `discord-api-types`.
- Re-exports `@wolfstar/discord-utilities` (`export * from '@wolfstar/discord-utilities'`), as
  `@sapphire/discord.js-utilities` does with its base package.

## `http-framework-utilities` contents

### Type guards and permission helpers

- Channel guards over `APIChannel` / `APIInteractionDataResolvedChannel` / nullish: `isCategoryChannel`,
  `isDMChannel`, `isGroupChannel`, `isGuildBasedChannel`, `isNewsChannel`, `isTextChannel`, `isVoiceChannel`,
  `isStageChannel`, `isThreadChannel`, `isNewsThreadChannel`, `isPublicThreadChannel`, `isPrivateThreadChannel`,
  `isTextBasedChannel`, `isVoiceBasedChannel`, `isNsfwChannel`.
- Other guards: `isGuildMember` (`APIGuildMember` / `APIInteractionGuildMember` / resolved member), `isAnyInteraction`,
  `isAnyInteractableInteraction`, `isMediaAttachment`, `isImageAttachment`, plus `isMessageButtonInteractionData`
  style helpers for component data.
- Permission helpers compute from the interaction's `app_permissions` bitfield instead of a cache, reusing
  `resolvePermissions` / `getMissingPermissions` from `@wolfstar/http-framework`: `canReadMessages`,
  `canSendMessages`, `canSendEmbeds`, `canSendAttachments`, `canReact`, `canRemoveAllReactions`,
  `canJoinVoiceChannel`. Each takes an interaction (or a raw `app_permissions` string/bigint) plus, where relevant,
  the channel for thread/voice specifics. Without Sapphire's cache, a helper that cannot decide from the payload
  returns `false`, never throws.
- Discord.js-specific guards (`isMessageInstance`, `isGuildBasedChannelByGuildKey`) are dropped.

### `MessageBuilder`

- Fluent builder producing the body accepted by the framework's reply / update / follow-up methods
  (`UpdateResponseOptions`-compatible): `setContent`, `setEmbeds`, `addEmbeds`, `setComponents`,
  `setAllowedMentions`, `setFlags`, `setTTS`, `toJSON()`. No `setFiles`: the framework's `reply` / `update` do not
  upload files, only `followup` does.
- Validates lengths against `MessageLimits` / `EmbedLimits` only on `toJSON()`, throwing a `RangeError` naming the
  field.

### `PaginatedMessage`

- API modelled on Sapphire's: `addPage`, `addPages`, `addPageEmbed`, `addPageContent`, `addPageBuilder`,
  `setActions`, `addAction`, `setIndex`, `setWrongUserInteractionReply`, `setIdle` (TTL),
  `run(interaction, target?)`.
- Default actions: first, previous, next, last, stop buttons, and a page-selection string select when pages > 1.
  Each action is `{ customId, type, run(context) }`; built-in actions use reserved ids.
- Variants: `LazyPaginatedMessage` (pages resolved on first display), `PaginatedFieldMessageEmbed<T>`,
  `PaginatedMessageEmbedFields`.
- `run(interaction)` replies to (or edits the deferred reply of) a command/component interaction with page 0 and
  stores the session. With a shared store, `run` accepts only eager JSON pages and reserved built-in action ids;
  lazy page functions, custom action callbacks, and non-JSON file values cause a `TypeError` before replying or
  saving state. Use a memory store and route clicks to the creating process for those features.
- Pages are limited by `SelectMenuLimits.MaximumOptionsLength` only for the page selector; beyond 25 pages the select
  shows a window around the current page.

### `MessagePrompter`

- Strategies `confirm` (yes/no buttons) and `number` (buttons from `start` to `end`, max 25, across at most five
  action rows). The number range is configurable, rather than promising parity with Sapphire's default 0–10 range.
- `run(interaction)` returns a promise resolved when the target user clicks, or resolved with `null`
  on timeout (matching Sapphire's `confirm` → `boolean`, `number` → `number`). HTTP has no collector: the package's
  interaction handler resolves an in-process waiter keyed by session id. A prompter is therefore process-local — the
  click must reach the process that called `run`. `run` rejects a shared store before replying rather than
  implying that a shared session can move the pending promise to another process. Multi-replica bots should use `PaginatedMessage`-style
  store-backed actions instead; this limitation is documented in the README.
- Strategies `message` and `reaction` are out of scope: HTTP-only bots do not receive messages or reactions.

## State and interaction flow

1. `PaginatedMessage.run` / `MessagePrompter.run` create a session
   `{ id, ownerId, kind, state, expiresAt, cleanupTarget }` and save it in a `SessionStore`. `cleanupTarget` contains
   the message id, channel id when available, and whether the response is ephemeral; credentials stay outside the
   serialised session (see timeout cleanup below).
2. `SessionStore` interface: `get(id)`, `set(id, value, ttlMs)`, `delete(id)`, all returning promises.
    - Default: `MemorySessionStore`, a `Map` with expiry checked on read and a periodic sweep (unref'd timer).
    - `RedisSessionStore` (`scope: 'shared'`) for multi-process bots, over a minimal `RedisSessionClientLike`
      (`get` / `set(key, value, 'PX', ms)` / `del`) that an `ioredis` `Redis` or `Cluster` satisfies without a
      dependency. `@wolfstar/plugin-cache` is a per-entity Discord cache, not a key/value store, so there is no
      adapter for it.
    - Configured once through `setSessionStore(store)`; per-instance override via options. Each store declares
      `scope: 'process' | 'shared'`, so `run` can validate supported session shapes before sending a response.
    - Shared stores support only eager JSON pages plus reserved built-in action ids, with no function registry
      fallback. This is the multi-replica-safe pagination shape. Lazy pages, custom action `run` callbacks, and
      prompter waiters require process-local memory, sticky routing, and do not survive a restart. Both `run` and
      the shared adapter's `set` reject unsupported state with a `TypeError` naming the field.
3. `custom_id` format: `<prefix>.<sessionId>.<action>`, with prefixes `wolfstar-pm` (paginated message) and
   `wolfstar-mp` (message prompter). Parsed by the framework's `StringIdParser`; the total stays under
   `ButtonLimits.MaximumCustomIdCharacters` (100). Session ids are short random ids (e.g. 12 base62 chars).
4. The package ships two `InteractionHandler` pieces (`wolfstar-pm`, `wolfstar-mp`). They register through the
   `@wolfstar/http-framework` plugin API from a `/register` side-effect entrypoint. Consumers must explicitly
   import `@wolfstar/http-framework-utilities/register` in their setup module before constructing the client,
   including when using `stars`, as they do for `@wolfstar/shared-http-pieces/register`. CLI discovery only matches
   `@wolfstar/plugin-*`; changing that discovery is outside this design. The README must show the import.
5. On click: load session → if missing or expired, reply ephemerally with an "expired" message (overridable) and
   disable the components → if `interaction.user.id !== ownerId` and owner checking is on, reply with the
   wrong-user reply → otherwise run the action and `update` the message with the new page.
6. `stop` edits the current message, then deletes the session and cancels its timer. Timeout deletes the
   session and attempts to remove components (or disable them, configurable) through the cleanup target below.

### Timeout cleanup

- After the initial reply succeeds, retain a process-local cleanup record keyed by session id: the REST client,
  application id, interaction token and its absolute expiry, message target (`@original` or the returned message
  id), the last rendered components, and the deadline. Use an unref'd timer independent of store eviction, so
  expiry-on-read or a cache TTL cannot discard the edit target before cleanup runs.
- On idle refresh, replace the timer and its saved component snapshot. For shared sessions, the creating process
  re-reads the store at the deadline and reschedules if another replica extended `expiresAt`. Shared sessions
  retain the last rendered components in their JSON state; cleanup fetches the message when that state has
  expired before disabling controls, or simply removes the controls. A missing session
  triggers best-effort cleanup using the retained target. A stopped session's cleanup is idempotent.
- Edit via `PATCH /webhooks/{application.id}/{interaction.token}/messages/{message.id}` while the retained token
  is valid. Interaction tokens expire after 15 minutes, so token-only sessions (including ephemeral responses)
  have an absolute lifetime capped below that deadline, even when idle time is refreshed. Reject a requested TTL
  beyond that bound. Non-ephemeral bot-owned messages may instead use the retained channel/message ids and the
  configured bot REST credentials to edit after the webhook token expires. Never log or store tokens in the cache.
- Timer cleanup is best effort: process shutdown, serverless suspension, missing edit permissions, or API failures
  can leave expired controls visible. A shared store distributes pagination state, not timers or credentials;
  guaranteed cleanup across restarts requires a durable scheduler and is out of scope. Subsequent clicks use the
  expired-session handler to disable stale controls and send the ephemeral expiry notice.
- Always release the cleanup record and settle a local prompter waiter on timeout, even if editing fails. Log a
  sanitised cleanup error through `container.logger`; do not leave an unhandled rejection or revive the session.

## Error handling

- Invalid builder input: `RangeError` / `TypeError` at build time, with the offending field named.
- Store failures in the handler: logged through the framework logger (`container.logger`), user gets the generic
  expired reply; no unhandled rejections.
- Discord API errors from normal action `update`/`reply` calls: propagate through the framework's existing result handling; the session
  is not deleted, so a retry is possible.

## Testing

- `vitest`, one test file per module, patterned on `packages/start-banner/tests`.
- `discord-utilities`: regex positive/negative fixtures, limits snapshot, resolvers over raw payload fixtures.
- `http-framework-utilities`: guards, permission helpers from `app_permissions` fixtures, `MessageBuilder`
  validation, pagination state machine (index moves, wrapping, window for >25 pages), session store expiry with fake
  timers, handler flow with mocked interactions (expired, wrong user, stop), explicit `/register` handler loading,
  shared-store rejection of callbacks/prompters, and cross-replica eager-page navigation. Test timeout edits after
  store eviction, idle refresh on another replica, token lifetime bounds, and failed cleanup releasing waiters.
  No calls to the real Discord API.

## Out of scope

- A separate `@wolfstar/plugin-gateway-utilities` package: gateway support ships as the
  `@wolfstar/http-framework-utilities/gateway` subpath instead (see Revision 2).
- `MessagePrompter` `message` / `reaction` strategies and collectors on the main entrypoint (HTTP-only bots receive
  neither); they exist only on the `/gateway` subpath. Channel/guild caching of our own.
- Changes to `@wolfstar/http-framework` itself, beyond what the implementation plan finds strictly necessary.

## Repository chores

- A changeset (`minor`) for each new package.
- When implementing the packages, add both to `.npm-deprecaterc.yml`'s enumerated snapshot list and to knip
  configuration if needed.
- When implementing the packages, update `AGENTS.md` package count (25 → 27) and describe both packages briefly;
  `CLAUDE.md` is a symlink to that file.
- npmjs.com trusted-publishing setup for both new names (manual, see `.changeset/README.md`).

## Revision 2 (2026-09-29)

Decisions taken while aligning the implementation with this spec and adding gateway support.

### Alignment clarifications

- **Store scope.** `SessionStore.scope` is required: `MemorySessionStore` is `'process'`, `RedisSessionStore` is
  `'shared'`. A shared-state check (`assertSharedSessionState`) rejects, with a `TypeError` naming the field,
  unresolved lazy pages, custom action callbacks, and values that do not survive a JSON round trip. With a shared
  store the click handler never falls back to the process-local runtime registry.
- **Handler registration.** Importing `@wolfstar/http-framework-utilities/register` is required and documented.
  `run` still self-registers the handlers as a safety net for the creating process; that does not replace the import
  for processes that only receive clicks.
- **Expired or unknown sessions.** One HTTP interaction gets one response, so the handler `update`s the message with
  every component of `interaction.message` disabled, then sends the expiry notice as an ephemeral `followup`.
  `expiredReply` is configurable per instance and defaults to `DefaultExpiredReply`.
- **Timeout cleanup scope.** Cleanup is scheduled by `run(...)`. `start(ownerId)` flows send the payload themselves
  and have no timeout cleanup; later clicks still expire the controls.
- **Token bound.** `MaximumTokenLifetime` is 14 minutes (one-minute margin below Discord's 15). A session whose only
  edit credential is the interaction token (ephemeral replies, or no channel/message id) caps its absolute
  lifetime at that bound; `idle` above it is a `RangeError`. For a non-ephemeral reply, `run` fetches the real
  message id after replying when `idle` exceeds the bound, and cleanup after the token expires uses the bot's
  `container.rest` on `Routes.channelMessage(channelId, messageId)`.
- **Timeout behaviour.** `timeoutBehavior: 'disable' | 'remove'`, default `'disable'`. `stop` always disables.

### Gateway support: `@wolfstar/http-framework-utilities/gateway`

- A subpath export with `@wolfstar/plugin-gateway` (`^0.8.0`) as an **optional** peer dependency; the main
  entrypoint never imports it. Clicks still arrive as HTTP interactions and use the same `wolfstar-pm` /
  `wolfstar-mp` handlers, so a gateway bot also serves its interactions endpoint (`GatewayClient.start({ listen })`).
- **Type guards** with the main entrypoint's names, narrowing to `@wolfstar/plugin-gateway` structures
  (`isTextChannel(channel): channel is TextChannel`, …), plus the discord.js-only guards dropped from the HTTP entry:
  `isMessageInstance`, `isGuildMember` (structure), `isGuildBasedChannelByGuildKey`.
- **Permission helpers** (`canReadMessages`, `canSendMessages`, `canSendEmbeds`, `canSendAttachments`, `canReact`,
  `canRemoveAllReactions`, `canJoinVoiceChannel`) take a channel structure and return `Promise<boolean>`: they compute
  the bot's permissions with `computePermissionsIn(channel, clientUserId)` (DM channels allow sending and reacting),
  honour `Administrator`, use `SendMessagesInThreads` in threads, and resolve `false` instead of throwing when the
  permissions cannot be computed.
- **Collectors**: `awaitMessages(channel, { filter?, max?, time })` and `awaitReactions(message, { filter?, max?, time })`
  listen to the framework client's `messageCreate` / `messageReactionAdd` events and always remove their listeners.
- **`GatewayPaginatedMessage`** extends `PaginatedMessage`; `run(target, author?)` accepts an HTTP interaction
  (unchanged behaviour), a gateway `Message` (replies to it), or a text-based channel (sends to it). Gateway messages
  are bot-owned and non-ephemeral, so timeout cleanup uses the bot REST path without the token bound.
- **`GatewayMessagePrompter`** extends `MessagePrompter` with the same targets and adds Sapphire's `message` strategy
  (resolves with the author's next `Message` in the channel) and `reaction` strategy (reacts with the configured emojis
  and resolves with the chosen one). Both check the client's intents (`GuildMessages` / `DirectMessages`, plus
  `MessageContent` for `message`; `GuildMessageReactions` / `DirectMessageReactions` for `reaction`) and throw
  before sending when they are missing.
- Tests use `@wolfstar/plugin-gateway` as a devDependency with a fake client (event emitter and mocked REST); no
  gateway connection.
