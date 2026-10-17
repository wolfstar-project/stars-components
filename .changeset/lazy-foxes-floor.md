---
'@wolfstar/decorators': patch
'@wolfstar/http-framework-utilities': patch
'@wolfstar/http-framework-test-utils': patch
'@wolfstar/shared-http-pieces': patch
'@wolfstar/shared-influx-pieces': patch
---

Raise the `@wolfstar/http-framework` range to `^6.4.0`. The packages already declare it as `workspace:^`, but `onlyUpdatePeerDependentsWhenOutOfRange` kept them from being republished after the framework's minor releases, so the ranges on npm were still `^6.0.0` (and `^6.3.0` for `@wolfstar/decorators`).
