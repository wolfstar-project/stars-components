# AGENTS.md

Project conventions discovered for `stars-components` (formerly `archid-components`).

## Stack

- **Language:** TypeScript (`~7.0.2` in every package/example; the root `package.json` devDependency is still pinned to `~5.8.3`), Node `^22.11 || ^24 || >=26` (the range required by Changesets v3; published packages still declare `>=20`).
- **Package manager:** `pnpm` (corepack-pinned via `packageManager` in root `package.json`; Renovate bumps the patch version often — check that file for the exact pin, don't hardcode it here). Workspaces via `pnpm-workspace.yaml`.
- **Monorepo runner:** `turbo` (`turbo run build|typecheck`).
- **Bundler:** `tsdown` per package.
- **Typecheck:** `golar tsc` (each package and TypeScript example has its own `golar.config.ts`, and a root one too; the `*-js` examples have none) — `typecheck` scripts run `golar tsc -p ../../tsconfig.json` instead of bare `tsc`; `dev.typecheck.checker: 'auto'` in `stars.config` also picks `golar` whenever the project depends on it, `tsc` otherwise.
- **Tests:** `vitest` (workspace config at root).
- **Benchmarks:** `benchmarks/` (repository root, not a package) holds the CodSpeed benchmarks as standalone `tinybench` (pinned to v5: `@codspeed/tinybench-plugin` does not support v6) and runs with `pnpm bench`. It is not on Vitest: Vitest 5 has no `bench` export and `@codspeed/vitest-plugin` only supports Vitest 3.2/4. The files import the packages' TypeScript sources on Node's own type handling (`--experimental-transform-types`, so no decorators or build step), and `benchmarks/ts-resolver.mjs` maps `.js`/extensionless relative imports to `.ts` and `@wolfstar/schema`/`@wolfstar/http-framework` to their sources. Add a file exporting `register(bench)` and call it from `benchmarks/index.ts`. The `⚡ Run benchmarks` job (`.github/workflows/codspeed.yml`) runs it through `CodSpeedHQ/action` with OIDC, no token secret.
- **Lint:** `oxlint` with `oxlint-tsgolint`.
- **Format:** `oxfmt`.
- **Release:** [Changesets](https://github.com/changesets/changesets) v3 (`@changesets/cli` + `changesets/action` in CI, see `.github/workflows/release.yml`). Packages version independently, not in lockstep (`.changeset/config.json` has `fixed: []`, `linked: []`); `updateInternalDependencies: patch` bumps workspace dependents. Publishes authenticate via npm trusted publishing (OIDC, `id-token: write`), which also generates provenance attestations automatically — no npm token secret, see `.changeset/README.md` for the required per-package npmjs.com setup.
  v3 specifics that the config relies on: `format: "oxfmt"` (v3 replaced the `prettier` option with `format`, and generated changelogs must satisfy `oxfmt --check`), and `privatePackages: { version: true, tag: false }` (v3 stopped versioning private packages by default — this keeps the `examples/*` apps versioned as before).
- **Deprecation:** `@favware/npm-deprecate` (driven by `.npm-deprecaterc.yml`).
- **Diagnostics/errors:** `nostics` (`defineDiagnostics`) backs `@wolfstar/schema`'s config validation/load errors (`configDiagnostics` catalog, `@wolfstar/http-framework/config`) and `@wolfstar/cli`'s own errors (`cliDiagnostics` catalog) — stable, typed diagnostic codes with a why/fix/docs link instead of hand-rolled `ConfigError`/`CliError` classes; `formatError` renders them with nostics' ANSI formatter, and `exitCodeOf` maps codes to process exit codes. Unexpected/unhandled CLI errors render as a `my-bad` report instead of a bare `error.stack`.

## Quality gates (in order)

1. `pnpm lint`
2. `pnpm build`
3. `pnpm typecheck` (resolves cross-package imports against built `dist/*.d.ts`, so it needs `pnpm build` first)
4. `pnpm test`

## Commands

```bash
pnpm install                          # setup (also installs the husky hooks)
pnpm build                            # turbo run build (tsdown per package); needed before typecheck
pnpm typecheck                        # turbo run typecheck (golar tsc per package/example)
pnpm lint                             # oxlint + oxfmt --check over packages, examples and benchmarks
pnpm lint:fix                         # oxlint --fix + oxfmt --write
pnpm test                             # vitest run (all projects)
pnpm vitest run <path>                # single test file from the repo root, e.g. pnpm vitest run packages/cli/test/bridge.test.ts
pnpm --filter @wolfstar/cli test      # one package's tests
pnpm --filter @wolfstar/cli build     # build one package (tsdown); `watch` rebuilds on change
pnpm --filter @wolfstar/cli typecheck # typecheck one package (needs its dependencies built)
pnpm bench                            # CodSpeed benchmarks (tinybench), see Stack
pnpm changeset                        # add a changeset (`pnpm changeset add --empty` when no release is needed)
```

- The root `vitest.config.ts` only lists projects (`packages/**/vitest.config.ts`, `examples/**/vitest.config.{ts,js}`) with `globals: true` and v8 coverage on; a package without a `vitest.config.ts` is not run by `pnpm test`. Tests live in `test/` (`@wolfstar/cli`) or `tests/` (most other packages).
- Examples build and run through the CLI by path: `cd examples/<name> && pnpm dev` (`stars dev`), `pnpm build`, `pnpm start`. Build `packages/cli` first (`pnpm --filter @wolfstar/cli build`), since they run `packages/cli/dist/cli.js`.
- Per-package `pnpm --filter <pkg> lint` runs `oxlint src --fix`, which rewrites files; use the root `pnpm lint` for a read-only check.
- Do not run `pnpm publish`, `pnpm publish:snapshot` or `pnpm tolgee:push` locally without asking (see "Secrets, approvals, and definition of done").

## Conventions

- Commits: Conventional Commits (`@commitlint/config-conventional`); `cz-conventional-changelog` via commitizen.
- PR titles follow Conventional Commits and are validated by `.github/workflows/semantic-pull-requests.yml` (the allowed types and scopes are listed there; the subject must not start with an uppercase letter). Scope rules:
    - Use the package directory name without the `@wolfstar/` prefix (e.g. `feat(cli): ...`, `fix(schema): ...`).
    - Use `deps` for dependency updates, `release` for the release PR, and `ci` for workflow changes. Documentation about a package uses that package's scope (e.g. `docs(http-framework): ...`).
    - Omit the scope when the change is too broad for a single one.
    - A new package must be added to the `scopes` list in that workflow, or PRs scoped to it fail title validation.
- When you need to commit, use the `/git-commit` skill if it is available in your environment (otherwise commit by hand following the Conventional Commits rules above; commitlint rejects body lines longer than 100 characters).
- When you need to open a PR, use the `/create-pull-request` skill if it is available in your environment (otherwise use `gh pr create`). Either way, the PR must follow the template rule below.
- Always open a PR with [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md): keep every section (linked issue, context, description, key changes, type of change, pre-flight checklist), fill them in, and tick the checklist items that apply. Never replace the body with a free-form summary, and never drop a section; write in your own words rather than pasting generated text. Pass the filled template to `gh pr create --body-file`.
- File paths in CI use the npm scope as `--filter @<scope>/<package>` for turbo.
- Each package declares: `name`, `author` (scope handle), `repository.url`, `bugs.url`, `homepage`, `keywords`.
- 27 publishable `@wolfstar/*` packages under `packages/`, each with its own independent semver — there is no lockstep version. Merging a changeset (`pnpm changeset`) to `main` makes `changesets/action` (pinned v2, see `.github/workflows/release.yml`) open/update a `chore: update changelog and release` PR; merging that PR bumps the affected packages' versions, regenerates their CHANGELOGs (via `.changeset/generator.ts`), and publishes to npm. Any other push to `main` touching `packages/` or `package.json` also publishes an `@next` snapshot (`pnpm publish:snapshot` → `scripts/publish-snapshot.mjs`, which skips the publish when there are no pending changesets because `changeset version` exits `1` in that case since v3).
- `pkg.pr.new` continuous preview releases (`.github/workflows/pkg-pr-new.yml`): every PR, push to `main`, and manual dispatch builds and runs `pnpm exec pkg-pr-new publish --pnpm './packages/*'` (read-only `contents` permission, no npm publish) so a PR's package versions can be installed for testing before a Changesets release.
- `.github/workflows/pullfrog.yml` runs an AI coding agent (the [Pullfrog Action](https://docs.pullfrog.com)) on `workflow_dispatch` with a `prompt` input, authenticating with whichever provider API key secret is configured (e.g. `ANTHROPIC_API_KEY`/`CLAUDE_CODE_OAUTH_TOKEN`) — used for scheduled/manual maintenance tasks such as AGENTS.md audits.
- `@wolfstar/cli` (the `stars` binary — `dev`/`build`/`info`/`codegen`/`prepare`/`commands`/`doctor`/`completions`) is a publishable package under `packages/cli`. The `stars.config` schema and loader (`defineConfig`/`loadStarsConfig`) live in their own package, `@wolfstar/schema` (`packages/schema`), which `@wolfstar/http-framework` re-exports unchanged as `@wolfstar/http-framework/config`; both `@wolfstar/cli` and `@wolfstar/http-framework` depend on `@wolfstar/schema`, not on each other's `/config` export, so any tool can resolve a project's configuration without pulling in either. `@wolfstar/http-framework` itself depends on `@wolfstar/cli` and exposes a `stars` bin (`bin/stars.mjs`, re-exporting `@wolfstar/cli/cli`) the way `nuxt` exposes `nuxi`'s binary — `@wolfstar/cli` has no install-time dependency on `@wolfstar/http-framework` in return (the same way `@nuxt/cli` has none on `nuxt`): its one runtime touch point, `@wolfstar/http-framework/auto-imports`, is resolved dynamically from the target project at `packages/cli/src/utils/framework-auto-imports.ts` instead of being declared as a dependency, which is what keeps the two packages from depending on each other. See `## The stars CLI configuration` below.
  `packages/cli/src` follows `nuxt/cli`'s layout: `commands/*` are self-contained command modules sharing `commands/_shared.ts`; `utils/` holds generic helpers (`framework-auto-imports.ts`, `locales.ts`, `plugin-registrations.ts`); `dev/` holds the dev server and its terminal UI (`dev/tui/*`); `builders/` holds the tsdown/vite/nitro builder adapters. `main.ts` defines the root command, `run.ts` exports `runMain`, `cli.ts` is the bin shim, and `index.ts` re-exports the public API (including `runMain`). Tests live under `test/` (renamed from `tests/`).
- `stars dev` UI (#252): `DevService` (`packages/cli/src/dev/dev-service.ts`) stays the headless core and the renderers only subscribe to it. The TUI has two layouts (`dev.layout`, `--layout`, the `v` key; `resolveLayout` in `dev/tui/ink/DevApp.tsx`): the full-screen `Dashboard` (sidebar with status and channel/level filters, `LogPane`, `PromptCard`; alternate buffer; default from 90x20) and the older bottom-pinned `Panel` (normal buffer; the fallback for a small terminal). Everything that is not Ink lives in `dev/tui/log-view.ts` (filter, `buildRows`, `highlight`) and is unit tested without a terminal; `test/renderers.test.tsx` drives both layouts through `@xterm/headless`. A `LogEntry` has a `channel` (defaulting per source through `SOURCE_CHANNELS`: `cli`, `build`, `bot`, `types`, `tunnel`), a level (`trace` added) and optional `detail` lines; `dev.logs`/`--channel`/`--level` only choose what a renderer shows at start, the log files (`dev.logFile`, plus one file per run in `dev.logs.dir`) are never filtered.
- Dev bridge (`packages/cli/src/dev/bridge.ts`): what happens inside the bot reaches the CLI over IPC, not by parsing stdout. `createSupervisor` spawns the bot with an `'ipc'` stdio slot and `bridgeImportArgs` preloads a `data:` module (`node --import`, after the `env` and modules preloads) that registers a `stars:dev-bridge` object plugin on the project's own `Client` and `process.send`s typed `BridgeMessage`s (`ready`, `pieces`, `hmr`, `commands`, `dispatch`, `request`, `refreshed`, `log`), all tagged `source: 'stars:bridge'`; the CLI answers with `source: 'stars:cli'` (`commands:refresh`). It needs `@wolfstar/http-framework` >= 6.1.0 (object plugins) resolved from the project and is skipped otherwise; a build that bundles the framework (Vite, Nitro) has its own copy the preload cannot reach, so those channels stay empty there. The bridge source is a string in the CLI on purpose: the CLI still has no dependency on the framework. It feeds the `hmr`, `commands`, `interactions`, `http` and `lifecycle` channels, the command refresh prompt (`dev.commands.refresh`: the bot's registry snapshot is diffed against the previous one, the first of a session being the baseline, and a redeploy is the bot's own `registry.push*`), and hot reload: when the bot reported `hmrStart` and every file the build changed (`snapshotFiles`/`changedFiles` in `dev/changed-files.ts`: content hashes of `build.outDir`, or of `dev.watch` for `none`, minus the locales copy, because `tsdown` rewrites its whole output on every rebuild) is one the bot can replace — in a store path and either a file it reported a piece from or a new file that passes the stores' filter (`couldBePiece`), so not a helper module such as `_shared.js` — `DevService` skips the restart (`dev.hmr`); `hmrStop` turns that off again. Every bridge message is checked against the shape of its type (`SHAPES`) before it reaches `DevService`, because the `log` type is open to plugins. With `STARS_COMMANDS_DUMP=1` the same preload makes the bot report its registry after `client.load()` and exit, which is how `stars commands diff`/`deploy` (`utils/local-commands.ts`) read the commands a project defines; that needs the built output.
- Plugins and modules (#245): `@wolfstar/http-framework` has two layers. Runtime plugins are plain objects from `definePlugin` (`StarsPlugin`: `name`, `enforce: 'pre' | 'post'`, `apply`, and the five hooks as `(client, options)`), registered with `Client.use(...)` or per client through `ClientOptions.plugins`; `PluginManager` orders them `pre`, plain, `post` and wraps their errors in `PluginHookError`. The legacy `Plugin` class, symbol hooks and `registerXHook` keep working through an adapter in `PluginManager` that emits one `DeprecationWarning` (`HTTP_FRAMEWORK_LEGACY_PLUGIN`) per plugin name; legacy errors are not wrapped. Installable modules are `defineModule` from `@wolfstar/kit` (`packages/kit`, the `@nuxt/kit` counterpart: `meta`, `defaults`, `dependencies`, `hooks`, `setup(options, ctx)`), listed in `modules` in `stars.config` (`packages/schema/src/config/modules.ts`, resolved to `ResolvedStarsConfig.modules`). `@wolfstar/kit` depends on `@wolfstar/schema` only, never on the framework or the CLI, so `@wolfstar/plugin-*` packages depend on it as a light peer; it is deliberately not re-exported from `@wolfstar/http-framework/config` (the config facade test pins that export list to `@wolfstar/schema`'s). `setup` runs in the CLI process (`installModules` in `packages/cli/src/utils/modules.ts`, called by `loadProject` before `config:resolved`) and shares the CLI's `hookable` registry through `ctx.hook`/`callHook`. What it contributes lands in `ResolvedStarsConfig.runtime` (`ModulesRuntime`) and `imports.presets`, and is carried over when `env:options` re-resolves the configuration. Runtime plugins cross into the bot by source, not by value: `ctx.addPlugin({ from, export, options })` (options JSON-serialisable; a function export is a factory called with them). `pluginRegistrations` (`packages/vite-server/src/plugins.ts`) turns them into the `\0stars:modules` virtual module, imported after `\0stars:env` and before the legacy `/register` imports, which skip any package listed in `modules`; `tsc`/`none` builds get the same registration from `moduleImportArgs` (`packages/cli/src/utils/env-import.ts`), a `node --import` preload in `stars dev`, and, for production, from `.stars/modules.mjs` (`prepareModulesPreload` in `packages/cli/src/utils/modules.ts`, written by `stars prepare`/`stars build`, started with `node --import ./.stars/modules.mjs <entry>`; `stars build`/`stars prepare`/`stars info` report a `MODULES_PRELOAD_REQUIRED` warning, `stars dev` does not; with `env` enabled it first imports a sibling `.stars/env.mjs`, because imports of one module all evaluate before its body; an absolute `from` becomes a `file:` URL in the file). The `/register` skip covers every installed module (`ResolvedStarsConfig.runtime.modules`), not only the listed ones, so a package installed by another module is not registered twice. `ctx.addPlugin` rejects relative `from` paths (they would resolve differently per build tool), `meta`-declared `hooks` are validated against `STARS_HOOK_NAMES`, and `apply` functions on `StarsPlugin` are evaluated once per client with the client's options. Not yet: `meta.configKey` (reserved), `ctx.addPiecesDir`/`addLocales`, runtime `client:*` module hooks, and gating `/register` off by a compatibility version — the `@wolfstar/plugin-*` regexp stays as the fallback for packages that are not listed in `modules`.
- Decorators: `@wolfstar/decorators` (`packages/decorators`) is the `@sapphire/decorators` counterpart — `ApplyOptions`, `RequiresGuildContext`/`RequiresDMContext`, `RequiresUserPermissions`/`RequiresClientPermissions`, `Enumerable`/`EnumerableMethod`, and the `createClassDecorator`/`createMethodDecorator`/`createProxy`/`createFunctionPrecondition` primitives. It peer-depends on `@wolfstar/http-framework` (for `PreconditionError`, `Identifiers`, and the permission helpers), so the framework must never depend on it back: the framework only keeps the registration decorators (`Register*`, `RestrictGuildIds`) and its own private `createClassDecorator`/`createMethodDecorator` copies in `packages/http-framework/src/lib/utils/decorators.ts`. `@wolfstar/decorators` is one of the default `imports.presets` (`DEFAULT_IMPORTS_PRESETS` in `packages/schema/src/config/resolve.ts`). The root `tsconfig.json` lists `packages/http-framework/` before `packages/` in `include` on purpose: `packages/decorators` sorts before the framework and imports its built `dist/*.d.ts`, so without that ordering the framework's duplicate `@sapphire/pieces` module augmentations get reported against its sources instead of against the declaration files (which `skipLibCheck` silences).
- Shareable tooling configs, extracted from this repo's own root config and published for external `@wolfstar/*` consumers: `@wolfstar/oxlint-config`, `@wolfstar/oxfmt-config`, `@wolfstar/eslint-config`, `@wolfstar/prettier-config`, and `@wolfstar/eslint-plugin-http-framework` (custom oxlint/ESLint rules for `@wolfstar/http-framework` and `@wolfstar/plugin-*` consumers, namespaced `wolfstar/*`). This repo's own root `.oxlintrc.json`/`.oxfmtrc.json` are the source these were extracted from, not consumers of them — the root config is not migrated to `extends`/depend on the published packages. `@wolfstar/oxlint-config` and `@wolfstar/oxfmt-config` are built TypeScript modules (`tsdown`, same layout as `@wolfstar/prettier-config`) whose default export is built with oxlint's/oxfmt's own `defineConfig` helper, not raw JSON — consumers write `import baseConfig from '@wolfstar/oxfmt-config'` / `extends: [baseConfig]` in an `oxlint.config.ts`, not `with { type: 'json' }` imports or file-path `extends`.
- i18n: `@wolfstar/plugin-i18next` (external, published from `wolfstar-project/plugins`) is the standard `@wolfstar/http-framework` i18n plugin — `@wolfstar/shared-http-pieces` consumes it directly. `@wolfstar/http-framework-i18n` has been removed from this monorepo in favour of it (deprecate the published versions on npm separately); `@wolfstar/i18next-backend` remains published as the plugin's backend dependency. `@wolfstar/i18next-type-generator` is a CLI (`i18next-type-generator <locales-dir> <output.d.ts>`) that generates the i18next `CustomTypeOptions` augmentation from locale JSON, replacing hand-maintained `LanguageKeys`/`T`/`FT` helpers; consuming packages wire it up via a `generate:i18n` script (see `packages/shared-http-pieces/package.json`). The CLI auto-registers installed `@wolfstar/plugin-*` packages (`packages/cli/src/utils/plugin-registrations.ts`, which re-exports the discovery logic from `@wolfstar/vite-server/internal`): it discovers them from the app's dependencies/optionalDependencies and injects each plugin's `/register` side-effect entrypoint before the app entry in tsdown and Vite builds, so consumers no longer need a manual `import '@wolfstar/plugin-i18next/register'`.
- `@wolfstar/discord-utilities` (`packages/discord-utilities`) and `@wolfstar/http-framework-utilities`
  (`packages/http-framework-utilities`) are the `@wolfstar` counterparts of `@sapphire/discord-utilities` and
  `@sapphire/discord.js-utilities`: library-agnostic limits/regexes/raw-payload option resolvers, and (built on top,
  depending on `@wolfstar/http-framework`) type guards, permission helpers, `MessageBuilder`, `PaginatedMessage`, and
  `MessagePrompter`. `PaginatedMessage`/`MessagePrompter` sessions live behind a pluggable `SessionStore` — an
  in-memory default, or a `RedisSessionStore` (over a minimal `get`/`set(key, value, 'PX', ms)`/`del` shape an
  `ioredis` client satisfies without a dependency) for bots running several processes. Their interaction handlers use
  the `wolfstar-pm` (paginated message) and `wolfstar-mp` (message prompter) custom-id prefixes. Importing
  `@wolfstar/http-framework-utilities/register` (before constructing the client) is required: it registers them on
  every process, including those that receive a click without ever calling `run` (e.g. behind a shared
  `RedisSessionStore`); the `stars` CLI does not auto-register it. Self-registration on the first
  `PaginatedMessage#run`/`MessagePrompter#run` is only a safety net. Gateway support is the
  `@wolfstar/http-framework-utilities/gateway` subpath (optional peer `@wolfstar/plugin-gateway@^0.8.0`, Node `>=24.17`):
  structure type guards, async `can*` permission helpers, `awaitMessages`/`awaitReactions`, `GatewayPaginatedMessage`,
  and `GatewayMessagePrompter` (adds the `message`/`reaction` strategies). Clicks still arrive as HTTP interactions, so
  gateway bots keep serving their interactions endpoint. It is not a separate package in `wolfstar-project/plugins`.
- Logging: `@wolfstar/http-framework` has a built-in logger (`container.logger`); `@wolfstar/logger` has been removed from this monorepo in favour of `@wolfstar/plugin-logger` (published from `wolfstar-project/plugins`).
- Tolgee sync is configured at root (`.tolgeerc.cjs`) and only targets `packages/shared-http-pieces/src/locales/**`.
  Scripts: `pnpm tolgee:push` (base `en`), `pnpm tolgee:pull` (pull + remap), `pnpm tolgee:ensure-languages`.
  Discord locale folders (en-US, es-ES, …) map to shorter Tolgee tags (en, es, …); see `LOCALE_MAP` in `.tolgeerc.cjs`.
  Project **Shared HTTP Pieces** (`33773`) has Tolgee namespaces disabled — keys live in the default namespace and remap into `commands/shared.json`.

## The `stars` CLI configuration

- A project's build lives in `stars.config.*`, not in a separate `tsdown.config.ts`: `tsdown: {}` (and `vite: {}` for
  `build.tool: 'vite'`) is merged into what the CLI derives from `entry`/`build`. The packages of this repository are
  libraries and keep their own `tsdown.config.ts` — this is about the bot projects the CLI builds.
- `future: { compatibilityVersion: 3 | 4 | 5 }` mirrors Nuxt's own: `5` is the default — everything in `4` plus the
  automatic `env` registration below. `4` (the convention-first rework, #182) stays supported: `tsdown` configured
  from `stars.config` alone, auto imports on and wired in, `'auto'` picking `tsdown` for TypeScript entries, `env`
  opt-in. `3` is **end-of-life** (a `tsdown.config.*` drives the build, auto imports off unless asked for): it still
  resolves, but pushes a `COMPATIBILITY_VERSION_EOL` diagnostic to `ResolvedStarsConfig.warnings` (printed by
  `stars build`/`prepare`/`info`/`dev`), and is to be removed in the next major together with the `build.configFile`
  branch of `TsdownBuilder`. The constants live in `packages/schema/src/config/compatibility.ts`; new behaviour is
  gated by a named version constant (`STARS_CONFIG_TSDOWN_VERSION` = 4, `AUTO_ENV_VERSION` = 5), never by
  `LATEST_COMPATIBILITY_VERSION`, so bumping the latest version never moves an older one onto other defaults.
- `env` in `stars.config` (`packages/schema/src/config/env.ts`) mirrors the serializable part of
  `@wolfstar/env-utilities`' `EnvSetupOptions` (`path`, `env`, `prefix`, `loader`, `debug`, `encoding`, plus
  `enabled`); `packages/env-utilities/tests/schema-mirror.test-d.ts` (a vitest typecheck test with its own
  `tests/tsconfig.typecheck.json`, since the root tsconfig excludes `tests/`) fails when the two drift. It defaults on
  from version 5 only when the project depends on `@wolfstar/env-utilities`, and off with `experimental.enableNitro`.
  `pluginRegistrations` (`packages/vite-server/src/plugins.ts`, shared by the tsdown, Vite and Nitro builders) makes
  the `\0stars:env` virtual module (calling `setup()` with the options as JSON) the entry's first import, ahead of the
  `@wolfstar/plugin-*/register` ones. `tsc`/`none` builds never pass through that transform: `stars dev` preloads the
  same module with `node --import data:…` (`packages/cli/src/utils/env-import.ts`); production is up to the bot.
  `env.path` stays relative on purpose (resolved at runtime), so the build output is portable.
- `hooks` in `stars.config` are CLI lifecycle hooks run with `hookable` (unjs): the catalogue is `StarsHooks` in
  `packages/schema/src/types/hooks.ts` (`config:resolved`, `env:options`, `prepare:*`, `builder:created`,
  `tsdown:options`, `build:*`, `dev:*`), resolved and validated (`UNKNOWN_HOOK`) by `packages/schema/src/config/hooks.ts`
  — not with `hookable`'s `flatHooks`, which splits arrays into `name:0` keys and drops non-functions silently — and
  run by `packages/cli/src/utils/hooks.ts` (`loadProject`, `applyEnvOptions`). They run in the CLI process only;
  `env:options` is how a hook changes what the bot receives. `@wolfstar/schema` only needs types for them, so it does
  not depend on `hookable`; `@wolfstar/cli` does.
- Convention-first defaults (#182) beyond the compatibility version: `stars dev` forces `NODE_ENV=development` for
  config evaluation, build plugins, and the supervised process; `src/locales` is copied to the build output and kept
  in sync by a `chokidar` watcher (`packages/cli/src/utils/locales.ts`) instead of a hand-written `tsdown` plugin; and
  `@wolfstar/env-utilities`' `setup()` (aliased `envRun` in scaffolded `src/lib/setup/all.ts`) takes no argument,
  discovering `.env*` files under both `src/` and the project root itself. `@wolfstar/create-http-framework` now
  scaffolds a bare `defineConfig({})` (or `{ build: { tool: 'tsc' }, env: false }` for a `tsc` project, and
  `{ env: false }` for JavaScript) instead of specifying `entry`/`build`/`future`. Only the scaffolds whose entry goes
  through the `env` transform (TypeScript `tsdown`/`vite`) drop the hand-written `setup()` call; the manifest records
  `autoEnv: true` so a rerun against an older manifest still recognises the old `src/lib/setup` as pristine.
- `@wolfstar/create-http-framework` scaffolds `AGENTS.md` and `llms.txt` (`template/base/*.hbs`; an existing one
  that is not the generator's own unedited output is kept, see `AGENT_DOCS` in `src/tools/templateProcessor.ts`), wires
  `@wolfstar/eslint-plugin-http-framework` into the generated oxlint/ESLint configuration (`FRAMEWORK_LINT_RULES` in
  `src/tools/projectFiles.ts` must match the plugin's `recommendedRules`; a test pins it), and `--tunnel` writes
  `dev: { tunnel: true }` to `stars.config`.
- `@wolfstar/create-http-framework`'s `--build` also accepts the experimental, TypeScript-only `vite` and
  `vite-nitro` tools (`experimental.enableVite`/`enableNitro` in the generated `stars.config.ts`), and scaffolds the
  external gateway plugins via `--gateway`/`--cache`/`--redis`/`--sharder` (`@wolfstar/plugin-gateway`/`-cache`/
  `-sharder`, Node `>=24.17`; `--cache`/`--sharder` turn `--gateway` on, `--redis` turns `--cache` on). Nitro cannot
  be combined with `--sharder`. See `packages/create-http-framework/README.md` for the full flag/prompt reference.
- `@wolfstar/env-utilities` has a `loader?: 'node' | 'dotenv' | 'varlock'` (`EnvLoaderOptions`/`EnvSetupOptions`, also
  settable via the `DOTENV_LOADER` env var, and as `env.loader` in `stars.config`). `node` parses `.env*` files with Node.js'
  own `util.parseEnv` (Node.js 20.12 or newer) and expands them with the package's own `expand` (it mirrors `dotenv-expand`);
  `dotenv` uses `dotenv`/`dotenv-expand`; [varlock](https://varlock.dev) is a schema-based alternative run through
  `varlock load` with the `json-full` format. When no loader is requested, `varlock` is picked if a `.env.schema` is found
  and `varlock` is installed (an explicit `path` never selects it), else `dotenv` if `dotenv` and `dotenv-expand` are
  installed, else `node`. `dotenv`, `dotenv-expand` and `varlock` are optional peer dependencies, loaded lazily, and the
  package throws a friendly error if the packages of an explicitly requested loader are not installed.
  `@wolfstar/env-utilities/varlock` exports `EnvFromVarlock` (derive `Env` from varlock's generated `CoercedEnvSchema`)
  and `env` (varlock's typed `ENV`). This is experimental and independent of the `future.compatibilityVersion` default
  above.
- `stars prepare` (and `stars dev`/`stars build`, which call it) generates `.stars/tsconfig.json` and `imports.dts`
  (the way `nuxt prepare` generates `.nuxt/`), so projects no longer hand-maintain TypeScript paths/compiler options:
  it materializes Sapphire's base/extra-strict/decorators presets, `@/`, `~/`, `@@/`, `~~/`, and custom filesystem
  aliases, plus tsdown/Vite-appropriate compiler options (ESNext/Bundler, `noEmit`, isolated modules, verbatim
  syntax, forced module detection). `stars prepare --check` validates both generated files, including with auto
  imports disabled. Scaffolded `tsdown`-tool projects extend the generated `tsconfig.json` and run `stars prepare`
  after install.

## Branding

- **npm scope:** `@wolfstar`; **GitHub org:** `wolfstar-project`; **repo:** `stars-components`
- **Primary domain:** `wolfstar.rocks` (subdomains: `join.`, `donate.`, `cdn.`, `influxdb.`, `contact@`)
- **Influx org string:** `Wolfstar-Project`
- **CDN asset path:** `cdn.wolfstar.rocks/wolfstar-assets/...`
- READMEs use a generic Tolgee badge, not per-project Crowdin-era slugs.

## Design specifications

- [Discord utilities design](docs/superpowers/specs/2026-09-28-discord-utilities-design.md) defines the proposed
  utility packages, registration, session constraints, and cleanup contract. It is implemented in `packages/discord-utilities` and
  `packages/http-framework-utilities`; this is repository design documentation, not the external docs site.

## Notes for agents

- Do NOT touch `pnpm-lock.yaml` manually; let `pnpm install` regenerate it after `package.json` edits.
- Do not edit `package.json#version` or a package's `CHANGELOG.md` by hand; both are owned by Changesets. Add a changeset via `pnpm changeset` for any user-facing change instead. Manual/hotfix publishes are done by re-running the `Release` workflow via `workflow_dispatch`.
- The docs site was moved out of this repo to `wolfstar-project/website`; don't reintroduce a docs app or `netlify.toml` here.
- `pnpm lint` / `pnpm lint:fix` run `oxlint`/`oxfmt` across `packages`, `examples` and `benchmarks`; keep the runnable example apps under `examples/*` lint-clean too. The root `tsconfig.json` also includes `benchmarks/`, so every package's `typecheck` covers it.
- `examples/*` build through the `stars` CLI by path (`node ../../packages/cli/dist/cli.js …`) and use `@wolfstar/plugin-i18next` pinned to the exact version `@wolfstar/shared-http-pieces` depends on (two copies would register the plugin's hooks twice). `with-gateway`/`with-cache`/`with-sharder` use the external `@wolfstar/plugin-gateway`/`-cache`/`-sharder` libraries (no `/register` entry, Node `>=24.17`); `with-vite`/`with-nitro` exercise `experimental.enableVite`/`enableNitro` and load pieces with `container.stores.loadPiece`, since their bundles have no `commands` directory to scan.
- `pnpm-workspace.yaml` exempts `@wolfstar/plugin-*` from `minimumReleaseAge` (`minimumReleaseAgeExclude`), so freshly published first-party plugins install without the one-day quarantine.

## Secrets, approvals, and definition of done

- **Secrets:** never commit them. Local values go in gitignored `.env*.local` files (and
  `examples/**/.env`); only `.env.example` templates are tracked. CI secrets (`WOLFSTAR_TOKEN`, `CODECOV_TOKEN`, AI
  provider keys for the review workflows) live in GitHub Actions secrets. npm publishing uses OIDC trusted publishing,
  so no npm token exists anywhere.
- **Ask before:** publishing to npm or running `pnpm publish`/`publish:snapshot` locally, dispatching the `Release`
  workflow, force-pushing or rewriting history on shared branches, deleting branches/tags/releases, running
  `pnpm tolgee:push` (writes to the shared Tolgee project), and deprecating packages (`npm-deprecate`).
- **Done** means: the four quality gates above pass locally; a changeset exists for every user-facing package change
  (CI's `🦋 Verify changesets` runs `changeset status --since=origin/<base>` and fails without one); tests are added or
  updated for behaviour changes; and this file is updated when commands, directories, CI, or release flow change.

## Cloud VM notes

Applies to any agent running in a cloud VM (Cursor Cloud, Claude Code on the web, …), not to local development.

- Dependencies are pre-installed by the startup script (`pnpm install --frozen-lockfile`).
- The VM's default Node may differ from the Node 24 pinned by CI and `mise.toml`; check `node -v`. Any version in
  `engines` works for every gate.
- Running as root, `@wolfstar/env-utilities`' "inaccessible file" test fails: it `chmod 000`s a fixture, which root
  can still read. That failure is environmental, not a regression.

## Server integration packages

- `@wolfstar/vite-server` and `@wolfstar/nitro-server` own the optional Vite/Nitro builders. They depend on the
  shared `Builder`/`BuilderContext` contract in `@wolfstar/schema`, never on `@wolfstar/cli` or the framework.
- The CLI's builder adapters supply project-relative loading and plugin registration. Keep optional integrations
  lazy-loaded by the builder factory; Vite and Nitro themselves are resolved from the consuming project.
- CLI integration tests alias both packages to source so CI can run tests before a build.
- `experimental.enableNitro` is implemented (`packages/cli/src/builders/nitro.ts`), no longer an
  `EXPERIMENT_UNAVAILABLE` refusal — it wires a `NitroBuilder` into `stars dev`/`stars build` on top of Nitro v3's own
  Vite plugin (Nitro v3 requires Vite 8), reusing the project's Vite config and adding a generated server entry that
  wraps the `@wolfstar/http-framework` `Client` in `createFetchHandler` (from `@wolfstar/http-framework/fetch`),
  producing a `.output/` deployable to any Nitro preset instead of a `node:http` process.
