# with-testing

Exercises a real command class through `@wolfstar/http-framework-test-utils` without Discord credentials or an HTTP port.

## Run

```bash
pnpm --filter with-testing test
```

The test loads `PingCommand` into the store with `container.stores.loadPiece`, then dispatches a chat-input fixture via `createTestHarness`.
