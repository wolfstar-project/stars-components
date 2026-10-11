---
'@wolfstar/http-framework': patch
---

fix(http-framework): skip the error reply when the response already ended

`handleError` only checked `response.closed`, which turns `true` after the socket flushed. A command, autocomplete or interaction handler that threw right after answering the interaction made it call `end()` on an ended response, and the unhandled `ERR_STREAM_WRITE_AFTER_END` crashed the process. It now also skips the reply when `response.writableEnded` is set; the error is still emitted.
