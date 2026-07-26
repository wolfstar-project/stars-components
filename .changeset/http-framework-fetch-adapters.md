---
'@wolfstar/http-framework': major
'@wolfstar/http-framework-test-utils': major
---

Add universal Fetch (`createHandler`), Bun (`createServer` / `Bun.serve`), and Cloudflare Workers (`createExport`) adapters, and replace public `node:http` `ServerResponse` usage with an `HttpReply` abstraction. `Client.listen()` on `node:http` keeps the same behavior.
