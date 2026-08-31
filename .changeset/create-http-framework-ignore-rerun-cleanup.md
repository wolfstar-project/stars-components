---
'@wolfstar/create-http-framework': patch
---

fix: rerunning the generator with `--ignore` against an existing project (e.g. to toggle a feature
or switch `--language`) now removes stale files left behind by the previous run — e.g.
`src/commands/math.ts` after disabling `--subcommands`, or the previous language's `src/main.*`
after switching `--language` — instead of leaving them with imports for packages `package.json` no
longer declares. Hand-edited files are detected and left in place with a warning rather than being
deleted.
