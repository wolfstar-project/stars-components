---
'@wolfstar/http-framework-utilities': minor
---

Add `@wolfstar/http-framework-utilities`: type guards, `app_permissions`-based permission helpers, `MessageBuilder`, `PaginatedMessage` (with lazy and embed-field variants), and `MessagePrompter` for `@wolfstar/http-framework`, backed by a pluggable session store with a required `scope` (`MemorySessionStore` is process-scoped, `RedisSessionStore` is shared and rejects lazy pages, custom action callbacks, and `MessagePrompter`). `PaginatedMessage`/`MessagePrompter` schedule best-effort timeout cleanup (`timeoutBehavior: 'disable' | 'remove'`, capped at a 14-minute interaction-token lifetime, falling back to bot REST after that bound for non-ephemeral messages) and send a disabled-controls update plus an ephemeral expiry notice for expired or unknown sessions.
