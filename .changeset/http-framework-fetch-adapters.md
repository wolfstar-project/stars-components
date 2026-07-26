---
'@wolfstar/http-framework': major
'@wolfstar/http-framework-test-utils': major
---

Add universal Fetch (`createHandler`) and Bun (`createServer` / `Bun.serve`) adapters, and replace public `node:http` `ServerResponse` usage with an `HttpReply` abstraction. `Client.listen()` on `node:http` keeps the same behavior.
