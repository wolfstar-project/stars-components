---
'@wolfstar/http-framework': minor
---

Add `BaseInteraction#inDM()` and the `InDM` type next to `inGuild()`/`InGuild`. `inGuild()` now also narrows `user` to the member's user, `inDM()` narrows the guild fields and `member` to `undefined`, and `BaseInteraction#user` no longer relies on a non-null assertion. Refs #359.
