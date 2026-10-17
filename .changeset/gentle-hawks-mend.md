---
'@wolfstar/cli': patch
---

`stars dev --tunnel` keeps reporting the original `cloudflared` error, and enters the `failed` state, when the broken binary it tried to delete cannot be removed, instead of rejecting.
