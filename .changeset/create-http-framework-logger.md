---
'@wolfstar/create-http-framework': patch
---

Drop the generated `src/lib/setup/logger` module and the `@wolfstar/logger` dependency from scaffolded projects: `container.logger` is now provided by `@wolfstar/http-framework` out of the box.
