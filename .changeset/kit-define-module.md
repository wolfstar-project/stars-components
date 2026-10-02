---
'@wolfstar/kit': minor
---

New package: `defineModule` and the module runtime for installable Stars modules, the `@nuxt/kit` counterpart. A module declares `meta` (name, version, `compatibility` ranges checked against the project's `@wolfstar/http-framework` and `@wolfstar/cli`), `defaults`, `dependencies`, `hooks` and `setup(options, ctx)`, whose `ctx` offers `addPlugin`, `addImports`, `hook`, `callHook` and `installModule`. `setupModules` installs them once each, dependencies first, and failures are reported as `ModuleError`s.
