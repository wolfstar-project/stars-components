---
'@wolfstar/create-http-framework': patch
---

Fixed scaffolded projects never loading their commands. `client.load()` locates the `commands` directory relative to `package.json`'s `main` field (falling back to the working directory when `main` is unset), not relative to the file that calls it — but the generated `package.json` had no `main` field, so `client.load()` resolved to the project root instead of `dist/commands` (or `src/commands` for the JavaScript template). Combined with the entry point previously passing `baseUserDirectory: join(dirname(fileURLToPath(import.meta.url)), 'commands')`, which doubled the `commands` segment, scaffolded bots never registered any commands.

The generated `package.json` now sets `main` to the file the `start` script actually runs (`dist/index.js` for TypeScript, `src/index.js` for JavaScript), and the entry point calls `client.load()` with no arguments, matching the convention used by `examples/basic` and the production bots `staryl`/`ring`.
