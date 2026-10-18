---
'@wolfstar/twitch-helpers': patch
---

Fix the EventSub secret and callback being swapped when they are passed to `setVariables`. The secret was sent to Twitch as the webhook callback, and the callback URL was used to sign and verify notifications.
