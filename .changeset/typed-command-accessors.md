---
'@wolfstar/http-framework': minor
---

Add typed accessors to the command interactions: `ChatInputCommandInteraction#options`, `AutocompleteInteraction#options` and `#focused`, `UserContextMenuCommandInteraction#targetId`, `#targetUser` and `#targetMember`, and `MessageContextMenuCommandInteraction#targetId` and `#targetMessage`. They resolve the payload the same way as the arguments a command handler receives, and the raw `data` is unchanged. Refs #359.
