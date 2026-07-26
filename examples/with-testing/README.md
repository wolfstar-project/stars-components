# with-testing

Exercises a real `UserCommand` through `@wolfstar/http-framework-test-utils` without
Discord credentials or an HTTP port — the same approach documented for Skyra/WolfStar
HTTP bots.

```bash
pnpm --filter with-testing test
```

The test loads the command with `container.stores.loadPiece`, then dispatches a
chat-input fixture via `createTestHarness`.
