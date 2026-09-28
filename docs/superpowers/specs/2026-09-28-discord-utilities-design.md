# Discord utilities for `@wolfstar/http-framework` — design

Date: 2026-09-28
Status: approved design, pending spec review

## Goal

Provide the `@wolfstar` counterparts of
[`@sapphire/discord-utilities`](https://npmx.dev/package/@sapphire/discord-utilities) and
[`@sapphire/discord.js-utilities`](https://npmx.dev/package/@sapphire/discord.js-utilities), so that bots built on
`@wolfstar/http-framework` (and later on `@wolfstar/plugin-gateway`) get limits, regexes, option resolvers, type
guards, permission helpers, a message builder, paginated messages, and prompters without depending on discord.js.

## Packages

Two new publishable packages in this repository, under `packages/`, each versioned independently through
Changesets and scaffolded like `packages/start-banner` (`tsdown`, `golar`, `vitest`, `oxlint`, `oxfmt`).

### `@wolfstar/discord-utilities` (`packages/discord-utilities`)

- Library-agnostic: works on raw Discord API data only. No runtime dependency on `@wolfstar/http-framework`,
  `@discordjs/*`, or `@sapphire/*`.
- `discord-api-types` is a peer dependency (it is a dependency of `@sapphire/discord-utilities`; a peer avoids two
  copies of the enums in consumers).
- Own source, not a re-export of `@sapphire/discord-utilities`. The export names match Sapphire's, so migrating is an
  import-specifier change.
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
      raw `APIInteraction` objects (gateway, workers, tests).
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
  (`UpdateResponseOptions`-compatible): `setContent`, `setEmbeds`, `setComponents`, `setFiles`,
  `setAllowedMentions`, `setFlags`, `setTTS`, `toJSON()`.
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
  stores the session.
- Pages are limited by `SelectMenuLimits.MaximumOptionsLength` only for the page selector; beyond 25 pages the select
  shows a window around the current page.

### `MessagePrompter`

- Strategies `confirm` (yes/no buttons) and `number` (buttons from `start` to `end`, max 25).
- `run(interaction)` returns a promise resolved when the target user clicks, or rejected/resolved with `undefined`
  on timeout (matching Sapphire's `confirm` → `boolean`, `number` → `number`). HTTP has no collector: the package's
  interaction handler resolves an in-process waiter keyed by session id. A prompter is therefore process-local — the
  click must reach the process that called `run`. Multi-replica bots should use `PaginatedMessage`-style
  store-backed actions instead; this limitation is documented in the README.
- Strategies `message` and `reaction` are out of scope: HTTP-only bots do not receive messages or reactions.

## State and interaction flow

1. `PaginatedMessage.run` / `MessagePrompter.run` create a session `{ id, ownerId, kind, state, expiresAt }` and save
   it in a `SessionStore`.
2. `SessionStore` interface: `get(id)`, `set(id, value, ttlMs)`, `delete(id)`, all returning promises.
    - Default: `MemorySessionStore`, a `Map` with expiry checked on read and a periodic sweep (unref'd timer).
    - Optional adapter for `@wolfstar/plugin-cache` (subpath export `@wolfstar/http-framework-utilities/plugin-cache`,
      `@wolfstar/plugin-cache` as optional peer), for multi-process bots.
    - Configured once through `setSessionStore(store)`; per-instance override via options.
    - Session state must be JSON-serialisable for non-memory stores. Pages with functions (lazy pages, custom action
      `run`) stay memory-only; the store adapter keeps a process-local registry for them and documents that such
      sessions do not survive a restart.
3. `custom_id` format: `<prefix>.<sessionId>.<action>`, with prefixes `wolfstar-pm` (paginated message) and
   `wolfstar-mp` (message prompter). Parsed by the framework's `StringIdParser`; the total stays under
   `ButtonLimits.MaximumCustomIdCharacters` (100). Session ids are short random ids (e.g. 12 base62 chars).
4. The package ships two `InteractionHandler` pieces (`wolfstar-pm`, `wolfstar-mp`). They register through the
   `@wolfstar/http-framework` plugin API from a `/register` side-effect entrypoint, so the `stars` CLI auto-registers
   them like the `@wolfstar/plugin-*` packages; manual registration is documented for non-CLI setups.
5. On click: load session → if missing or expired, reply ephemerally with an "expired" message (overridable) and
   disable the components → if `interaction.user.id !== ownerId` and owner checking is on, reply with the
   wrong-user reply → otherwise run the action and `update` the message with the new page.
6. `stop` action and timeout both remove components (or disable them, configurable) and delete the session.

## Error handling

- Invalid builder input: `RangeError` / `TypeError` at build time, with the offending field named.
- Store failures in the handler: logged through the framework logger (`container.logger`), user gets the generic
  expired reply; no unhandled rejections.
- Discord API errors from `update`/`reply`: propagate through the framework's existing result handling; the session
  is not deleted, so a retry is possible.

## Testing

- `vitest`, one test file per module, patterned on `packages/start-banner/tests`.
- `discord-utilities`: regex positive/negative fixtures, limits snapshot, resolvers over raw payload fixtures.
- `http-framework-utilities`: guards, permission helpers from `app_permissions` fixtures, `MessageBuilder`
  validation, pagination state machine (index moves, wrapping, window for >25 pages), session store expiry with fake
  timers, handler flow with mocked interactions (expired, wrong user, stop). No calls to the real Discord API.

## Out of scope

- `@wolfstar/plugin-gateway-utilities` (lives in `wolfstar-project/plugins`, a follow-up that builds on
  `@wolfstar/discord-utilities`).
- `MessagePrompter` `message` / `reaction` strategies, collectors, channel/guild caching.
- Changes to `@wolfstar/http-framework` itself, beyond what the implementation plan finds strictly necessary.

## Repository chores

- A changeset (`minor`) for each new package.
- Add both packages to `.npm-deprecaterc.yml`'s snapshot list if that file enumerates publishable packages, and to
  knip configuration if needed.
- Update `AGENTS.md` / `CLAUDE.md` package count (25 → 27) and describe both packages briefly.
- npmjs.com trusted-publishing setup for both new names (manual, see `.changeset/README.md`).
