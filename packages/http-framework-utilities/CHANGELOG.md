# @wolfstar/http-framework-utilities

## 0.1.0

### Minor Changes

- [#239](https://github.com/wolfstar-project/stars-components/pull/239) [`2a54224`](https://github.com/wolfstar-project/stars-components/commit/2a54224ad22390d452331072b35b64ce2eea16d4) - Add `@wolfstar/http-framework-utilities`: type guards, `app_permissions`-based permission helpers, `MessageBuilder`, `PaginatedMessage` (with lazy and embed-field variants), and `MessagePrompter` for `@wolfstar/http-framework`, backed by a pluggable session store with a required `scope` (`MemorySessionStore` is process-scoped, `RedisSessionStore` is shared and rejects lazy pages, custom action callbacks, and `MessagePrompter`). `PaginatedMessage`/`MessagePrompter` schedule best-effort timeout cleanup (`timeoutBehavior: 'disable' | 'remove'`, capped at a 14-minute interaction-token lifetime, falling back to bot REST after that bound for non-ephemeral messages) and send a disabled-controls update plus an ephemeral expiry notice for expired or unknown sessions, set process-wide with `setDefaultExpiredReply` (read with `getDefaultExpiredReply`). Clicks on the same paginated message are handled one at a time per process, `stop` leaves a tombstone so a concurrent click cannot bring the session back, a failed save keeps the current page and sends an ephemeral notice set with `setDefaultSaveFailedReply`, and `registerSessionStore` lets every replica find sessions kept in a per-instance shared store. Custom actions with a `run` callback cannot reuse a built-in id (`PaginatedMessageBuiltinActionIds`).

    Add the optional `@wolfstar/http-framework-utilities/gateway` subpath for `@wolfstar/plugin-gateway`:

    - Structure type guards and async `can*` permission helpers.
    - `awaitMessages` and `awaitReactions` collectors.
    - `GatewayPaginatedMessage`, which can be sent to a gateway message or a channel.
    - `GatewayMessagePrompter`, which adds the `message` and `reaction` strategies. Thanks [@RedStar071](https://github.com/RedStar071)!

### Patch Changes

- Updated dependencies [[`2a54224`](https://github.com/wolfstar-project/stars-components/commit/2a54224ad22390d452331072b35b64ce2eea16d4)]:
    - @wolfstar/discord-utilities@0.1.0
