---
'@wolfstar/http-framework': minor
---

Add `MessageComponentInteraction#resolved` and the `MessageComponentResolved` type. It returns the raw `resolved` data of the user, role, channel and mentionable selects, typed per variant, and `null` for buttons and string selects. The select variants now read it instead of each reaching into `data.resolved`. Refs #359.
