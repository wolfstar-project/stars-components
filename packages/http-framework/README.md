<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/http-framework

**The HTTP-only Discord bot framework powering the Star Network.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/http-framework)](https://npmx.dev/package/@wolfstar/http-framework)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/http-framework)](https://npmx.dev/package/@wolfstar/http-framework)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

A powerful HTTP framework for building your Discord bots, powered by [`node:http`], [`@discordjs/rest`], and [`@sapphire/pieces`].

## Features

- Support for reloading and unloading commands
- Built-in Hot Module Reloading for every store
- Built-in logger, extendable by plugins
- Support for attachment responses
- Seamless integration with low-level libraries
- Thin wrapper on top of raw data for maximum performance

## Usage

This library can handle both HTTP interactions and registering commands both globally and per guild using an integrated design powered by decorators.

### Command

The Command is a piece that runs for all chat input and context menu interactions, including auto-complete (since this one is sort of part of the former). Registering the commands happens with decorators:

```typescript
import { Command, RegisterCommand } from '@wolfstar/http-framework';

@RegisterCommand((builder) =>
	builder //
		.setName('ping')
		.setDescription('Runs a network connection test with me')
)
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.sendMessage({ content: 'Pong!' });
	}
}
```

You can also register subcommands via decorators:

```typescript
import { Command, RegisterCommand, RegisterSubcommand } from '@wolfstar/http-framework';

@RegisterCommand((builder) =>
	builder //
		.setName('math')
		.setDescription('Does some maths.')
)
export class UserCommand extends Command {
	@RegisterSubcommand(buildSubcommandBuilders('add', 'Adds the first number to the second number'))
	public add(interaction: Command.ChatInputInteraction, { first, second }: Args) {
		return interaction.sendMessage({
			content: `The result is: ${first + second}`
		});
	}

	@RegisterSubcommand(buildSubcommandBuilders('subtract', 'Subtracts the second number from the first number'))
	public subtract(interaction: Command.ChatInputInteraction, { first, second }: Args) {
		return interaction.sendMessage({
			content: `The result is: ${first - second}`
		});
	}
}

function buildSubcommandBuilders(name: string, description: string) {
	return new SlashCommandSubcommandBuilder() //
		.setName(name)
		.setDescription(description)
		.addNumberOption((builder) =>
			builder //
				.setName('first')
				.setDescription('The first number.')
				.setRequired(true)
		)
		.addNumberOption((builder) =>
			builder //
				.setName('second')
				.setDescription('The second number.')
				.setRequired(true)
		);
}

interface Args {
	first: number;
	second: number;
}
```

### Registering commands without decorators

If you don't want to rely on TS decorators (for example, when writing plain JavaScript, or [`@sapphire/framework`]-style
codebases), you can instead override the `registerApplicationCommands` method, which receives a per-command registry
with the same capabilities as the decorators above:

```typescript
import { Command } from '@wolfstar/http-framework';

export class UserCommand extends Command {
	registerApplicationCommands(registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName('ping')
				.setDescription('Runs a network connection test with me')
		);
	}

	chatInputRun(interaction) {
		return interaction.sendMessage({ content: 'Pong!' });
	}
}
```

Subcommands, subcommand groups, context menu commands, and guild restriction are all available on the registry:

```typescript
import { Command } from '@wolfstar/http-framework';

export class UserCommand extends Command {
	registerApplicationCommands(registry) {
		registry
			.registerChatInputCommand((builder) => builder.setName('math').setDescription('Does some maths.'))
			.registerSubcommand((builder) => buildSubcommandBuilders(builder, 'add', 'Adds the first number to the second number'), 'add')
			.registerSubcommand(
				(builder) => buildSubcommandBuilders(builder, 'subtract', 'Subtracts the second number from the first number'),
				'subtract'
			);
	}

	add(interaction, { first, second }) {
		return interaction.sendMessage({ content: `The result is: ${first + second}` });
	}

	subtract(interaction, { first, second }) {
		return interaction.sendMessage({ content: `The result is: ${first - second}` });
	}
}
```

> **Note**: this is an alternative to the decorators, not a replacement — both approaches share the same underlying
> registry and can be mixed across different commands in the same project.

### Utility decorators

The utility decorators for configuring pieces and gating methods — `ApplyOptions`, `RequiresGuildContext`,
`RequiresDMContext`, `RequiresUserPermissions`, `RequiresClientPermissions`, `Enumerable`, `EnumerableMethod`, and the
`createClassDecorator`/`createMethodDecorator`/`createProxy`/`createFunctionPrecondition` primitives — live in their own
package, [`@wolfstar/decorators`](https://npmx.dev/package/@wolfstar/decorators), the same way `@sapphire/framework`
pairs with `@sapphire/decorators`:

```typescript
import { ApplyOptions, RequiresGuildContext } from '@wolfstar/decorators';
import { Command, RegisterCommand } from '@wolfstar/http-framework';

@ApplyOptions<Command.Options>({ name: 'kick' })
@RegisterCommand({ name: 'kick', description: 'Kicks a member' })
export class UserCommand extends Command {
	@RequiresGuildContext()
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: `Hello from ${interaction.guildId}!` });
	}
}
```

### Client

The `Client` class contains the HTTP server, powered by [`node:http`], it also registers a handler that processes whether or not the HTTP request comes from Discord and processes the information accordingly, handling the heavyweight in the background.

```typescript
import { Client } from '@wolfstar/http-framework';

const client = new Client({
	discordToken: process.env.DISCORD_TOKEN,
	discordPublicKey: process.env.DISCORD_PUBLIC_KEY
});

// Load all the commands and message component handlers:
await client.load();

// Start up the HTTP server;
await client.listen({ port: 3000 });
```

`Client#fetch` is the Web `Request`/`Response` counterpart of `listen()` — the same signature verification, routing
and replies, without binding a port. Use it to serve interactions from anything that speaks Fetch instead of
`node:http` (Nitro, a Worker, `Bun.serve`, `Deno.serve`, Vite's own dev middleware):

```typescript
export default {
	fetch: (request: Request) => client.fetch(request, { postPath: '/interactions' })
};
```

This is what `@wolfstar/cli`'s `experimental.enableNitro` uses under the hood: the generated Nitro server entry calls
`client.fetch(request)` directly instead of `listen()`, so `node:http` is swapped for whatever preset Nitro targets.

### Logger

The framework ships a minimal logger, available as `container.logger` (and as `client.logger`) as soon as
`@wolfstar/http-framework` is imported. It writes to the matching `console` method and filters entries by
`LogLevel`, which defaults to `LogLevel.Info`:

```typescript
import { container, Client, LogLevel } from '@wolfstar/http-framework';

const client = new Client({ logger: { level: LogLevel.Debug } });

container.logger.info('Ready');
container.logger.debug('Interaction received', interaction.id);
```

The built-in implementation is intentionally bare: it has no timestamps, colours, or transports. Those belong to a
logger plugin, which replaces it by assigning an `ILogger` to `options.logger.instance` from a
`preGenericsInitialization` hook:

```typescript
import { Plugin, preGenericsInitialization, type ClientOptions } from '@wolfstar/http-framework';

export class LoggerPlugin extends Plugin {
	public static [preGenericsInitialization](options: ClientOptions): void {
		options.logger ??= {};
		options.logger.instance = new MyLogger(options.logger);
	}
}
```

Because the plugin only has to satisfy the `ILogger` interface, the rest of the framework — including Hot Module
Reloading and the command router — keeps logging through `container.logger` without any change.

### Client events

The `Client` extends an event emitter typed by the `ClientEvents` interface. Every event name is also available as a
member of the `Events` enum, which is the recommended way to reference them, as the plain strings remain valid:

```typescript
import { Events } from '@wolfstar/http-framework';

client.on(Events.CommandError, (error, context) => {
	console.error(`Failed to run ${context.command.name}`, error);
});
```

| Enum member                            | Event name                      | Arguments                                     |
| -------------------------------------- | ------------------------------- | --------------------------------------------- |
| `Events.Error`                         | `error`                         | `error: unknown`                              |
| `Events.PluginLoaded`                  | `pluginLoaded`                  | `hook: PluginHook, name: string \| undefined` |
| `Events.CommandNameMissing`            | `commandNameMissing`            | `interaction, response`                       |
| `Events.CommandNameUnknown`            | `commandNameUnknown`            | `interaction, response`                       |
| `Events.CommandMethodUnknown`          | `commandMethodUnknown`          | `context`                                     |
| `Events.CommandRun`                    | `commandRun`                    | `context`                                     |
| `Events.CommandSuccess`                | `commandSuccess`                | `context, value: unknown`                     |
| `Events.CommandError`                  | `commandError`                  | `error: unknown, context`                     |
| `Events.CommandFinish`                 | `commandFinish`                 | `context`                                     |
| `Events.AutocompleteRun`               | `autocompleteRun`               | `context`                                     |
| `Events.AutocompleteSuccess`           | `autocompleteSuccess`           | `context, value: unknown`                     |
| `Events.AutocompleteError`             | `autocompleteError`             | `error: unknown, context`                     |
| `Events.AutocompleteFinish`            | `autocompleteFinish`            | `context`                                     |
| `Events.InteractionHandlerNameInvalid` | `interactionHandlerNameInvalid` | `interaction, response`                       |
| `Events.InteractionHandlerNameUnknown` | `interactionHandlerNameUnknown` | `interaction, response`                       |
| `Events.InteractionHandlerRun`         | `interactionHandlerRun`         | `context`                                     |
| `Events.InteractionHandlerSuccess`     | `interactionHandlerSuccess`     | `context, value: unknown`                     |
| `Events.InteractionHandlerError`       | `interactionHandlerError`       | `error: unknown, context`                     |
| `Events.InteractionHandlerFinish`      | `interactionHandlerFinish`      | `context`                                     |

The Hot Module Reloading events are listed in [their own section](#hot-module-reloading).

Listeners declared as pieces can use the enum too:

```typescript
import { ApplyOptions } from '@wolfstar/decorators';
import { Events, Listener } from '@wolfstar/http-framework';

@ApplyOptions<Listener.Options>({ event: Events.CommandError })
export class UserListener extends Listener {
	public run(error: unknown, context: ClientEventCommandContext) {
		console.error(`Failed to run ${context.command.name}`, error);
	}
}
```

### Hot Module Reloading

`@wolfstar/http-framework` ships with Hot Module Reloading (HMR) as a core feature, no plugin required. When enabled,
every path registered in every store is watched, and pieces are loaded, reloaded, and unloaded in place as their files
are created, changed, and deleted, without restarting the process.

```typescript
import { Client } from '@wolfstar/http-framework';

const client = new Client({
	discordToken: process.env.DISCORD_TOKEN,
	discordPublicKey: process.env.DISCORD_PUBLIC_KEY,
	// Development only, do not enable this in production:
	hmr: { enabled: process.env.NODE_ENV !== 'production' }
});

// `load` starts the reloader once the stores have been loaded:
await client.load();
```

The `hmr` option accepts [all of chokidar's options], plus:

| Option    | Default | Description                                                                                |
| --------- | ------- | ------------------------------------------------------------------------------------------ |
| `enabled` | `true`  | Whether HMR is started. Omitting the `hmr` option entirely also leaves the reloader unset. |
| `silent`  | `false` | Whether the reloader refrains from writing to the console. Events are always emitted.      |

The reloader is exposed as `client.hmr`, which is `null` when HMR is disabled, and can be stopped at any time:

```typescript
await client.hmr?.stop();
```

It can also be used standalone, without a `Client`, as long as the stores are registered in the container:

```typescript
import { HotModuleReloader } from '@wolfstar/http-framework';

const reloader = await new HotModuleReloader({ silent: true }).start();
```

The client emits an event for every operation, which is useful to react to changes, for example to push the updated
application commands to Discord while developing:

```typescript
client.on(Events.HmrPieceReloaded, async (piece) => {
	if (piece.store.name === 'commands') {
		await client.registry.pushGlobalCommandsInGuild(process.env.DEVELOPMENT_GUILD_ID);
	}
});
```

| Enum member               | Event              | Arguments               | Description                                          |
| ------------------------- | ------------------ | ----------------------- | ---------------------------------------------------- |
| `Events.HmrStart`         | `hmrStart`         | `paths: string[]`       | The reloader started watching the given store paths. |
| `Events.HmrStop`          | `hmrStop`          | —                       | The reloader stopped and closed all of its watchers. |
| `Events.HmrPiecesLoaded`  | `hmrPiecesLoaded`  | `pieces: Piece[], path` | A new file was created and its pieces were loaded.   |
| `Events.HmrPieceReloaded` | `hmrPieceReloaded` | `piece: Piece, path`    | An existing file changed and its piece was reloaded. |
| `Events.HmrPieceUnloaded` | `hmrPieceUnloaded` | `piece: Piece, path`    | A file was deleted and its piece was unloaded.       |
| `Events.HmrError`         | `hmrError`         | `error: unknown, path`  | An operation failed; saving the file again retries.  |

> **Note**: unloading a command also removes its entry from the `ApplicationCommandRegistry`, so a reloaded command is
> registered exactly once. HMR does not push the updated commands to Discord on its own, subscribe to the events above
> if you want that behaviour.

### Project configuration (`stars.config.*`)

The typed project configuration consumed by the [`stars` CLI](../cli) — the `defineConfig` helper and the config
loader — lives in [`@wolfstar/schema`](../schema), a small package shared by `@wolfstar/http-framework`
and `@wolfstar/cli` so neither depends on the other's runtime. `@wolfstar/http-framework` re-exports its public
surface unchanged as `@wolfstar/http-framework/config`, so any tool can resolve a project's configuration without
pulling in `@wolfstar/cli` — most projects should keep importing it from here rather than depending on
`@wolfstar/schema` directly.

The package also exposes `@wolfstar/http-framework/schema`, forwarding the shared schema's types and loader,
like Nuxt's `nuxt/schema`. Both facades preserve the same exports and function identities; existing `/config`
imports remain supported. Tooling can read the package metadata through `@wolfstar/http-framework/package.json`.

```typescript
import type { StarsConfig, ResolvedStarsConfig } from '@wolfstar/http-framework/schema';
```

Installing `@wolfstar/http-framework` also gives a project the `stars` binary (it depends on `@wolfstar/cli` and
exposes it as `stars`, the way `nuxt` exposes `nuxi`'s binary), so a project needs no separate `@wolfstar/cli`
install to run `stars dev`/`stars build`.

```typescript
// stars.config.ts
import { defineConfig } from '@wolfstar/http-framework/config';

export default defineConfig({});
```

`@wolfstar/http-framework/config` has no side effects — importing it (or a `stars.config.ts` that imports it) never
starts the bot. `loadStarsConfig` discovers `stars.config.{ts,mts,cts,js,mjs,cjs}` from a directory, applies defaults,
validates every option and resolves all paths to absolute ones.

`dev.url`, the URL `stars dev` shows and health-checks the bot on, needs no configuration either: it is detected the
way Vite's and Nuxt's dev servers are, from `HTTP_PORT` (env var, `src/.env*`/`.env*`, or `dev.env`) or `3000`, and
`localhost` is swapped for `127.0.0.1` at runtime if that is what is actually reachable. Set `dev.url` explicitly only
to override it, e.g. for a LAN address: `dev: { url: 'http://192.168.1.5:3000' }`.

`dev.banner` replaces the default Stars wordmark in the interactive CLI. Use a string or an array of lines, for
example `dev: { banner: ['★ STARYL', 'Twitch notifications'] }`, or `false` to hide it. Up to four lines fit the
compact panel (`dev.layout: 'panel'`); the dashboard, which is what a roomy terminal gets, shows the project's name
instead. Application logs and standalone banners go to the log stream, not over the dev UI.

`dev` also carries optional overrides for the dev loop. Press `t` in the TUI to toggle a quick tunnel without any
configuration:

```typescript
export default defineConfig({
	dev: {
		// A type checker next to the bot, reported on the dev UI's `types` channel. Never blocks a build.
		// `checker` is 'tsc' | 'golar' | 'tsz' | 'auto' (default: golar when installed, tsc otherwise).
		typecheck: { checker: 'golar' },
		// A cloudflared quick tunnel so Discord can reach the interactions endpoint, or an https URL you serve.
		tunnel: true,
		// Where the session's logs are mirrored, so a run can be read after the terminal UI is gone.
		logFile: '.stars/dev.log',
		// 'auto' (default): the full-screen dashboard on a terminal of at least 90x20, the compact panel otherwise.
		layout: 'auto',
		// What the dev UI shows at start; `dir` adds one log file per run next to `logFile`, keeping the last `keep`.
		logs: { channels: ['bot', 'commands', 'interactions'], levels: ['error', 'warn', 'info'], dir: 'logs', keep: 10 },
		// When the bot's application commands change: 'prompt' (default) asks before redeploying, 'auto', or 'off'.
		commands: { refresh: 'prompt' },
		// `false` restarts the bot on every change, even when the bot hot reloads its pieces (`hmr` on the Client).
		hmr: true
	}
});
```

With the `hmr` option of the `Client` enabled, a change that only touches pieces is left to the bot: `stars dev` does
not restart it, and the `hmr` channel of the dev UI shows what was reloaded. The channels that report what happens
inside the bot (`hmr`, `commands`, `interactions`, `http`, `lifecycle`) are fed by the bot itself, see
[`stars dev`](../cli#stars-dev).

`tunnel.updateEndpoint` writes the public URL to the Discord application's `interactions_endpoint_url`; it is opt-in
because it edits a live application, and needs `DISCORD_TOKEN` in the environment or the project's `.env`.

### The build (`tsdown`)

`tsdown` is the bundler `stars build` and `stars dev` use, and it is configured from `stars.config` itself. A base
project configures nothing at all — this is a complete build:

```typescript
export default defineConfig({});
```

The defaults are the configuration a bot would otherwise write out by hand:

| Option                     | Default                                                        | Why                                                                         |
| -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `entry`                    | every source file next to `entry`, minus `*.test.*`/`*.spec.*` | pieces are found by the stores, not imported by the entry                   |
| `unbundle`                 | `true`                                                         | keeps `dist/commands/…` loadable one file at a time at runtime              |
| `format` / `platform`      | `'esm'` / `'node'`                                             | what the framework and `node dist/…` expect                                 |
| `outDir` / `outExtensions` | `build.outDir` / the extension of `build.output`               | so `stars dev`, `package.json#main` and `node dist/…` agree                 |
| `tsconfig`                 | `build.tsconfig` (`src/tsconfig.json`, else `tsconfig.json`)   | `tsdown` alone looks only next to the root, missing the `src/` layout       |
| `sourcemap` / `treeshake`  | `true`                                                         | a deployed bot needs readable stack traces                                  |
| `minify`                   | `false`                                                        | nothing is shipped over a wire, so bytes buy nothing here                   |
| `deps.neverBundle`         | `true`                                                         | dependencies stay in `node_modules` instead of being copied into `dist`     |
| `alias`                    | `~`/`@` → the entry's directory, `~~`/`@@` → the project root  | the prefixes Nuxt gives every project                                       |
| `dts`                      | `false`                                                        | nothing consumes a bot's `dist/`; set `tsdown: { dts: true }` if yours does |

#### Aliases

The four prefixes Nuxt gives every project work out of the box, pointing at the same two places its own do:

```typescript
import { Greeting } from '~/lib/greeting'; // and '@/lib/greeting' — the entry's directory
import pkg from '~~/package.json'; // and '@@/package.json' — the project root
```

The build resolves them on its own; TypeScript needs the matching `paths` (the scaffold writes them, and
`examples/basic` shows them):

```jsonc
{
	"compilerOptions": {
		"paths": {
			"~/*": ["./src/*"],
			"@/*": ["./src/*"],
			"~~/*": ["./*"],
			"@@/*": ["./*"]
		}
	}
}
```

A project's own `tsdown.alias` is added to these rather than replacing them, and a target written as a relative path
(`'./src/lib'`) is resolved against the project root, the way every other path in `stars.config` is — a module id
(`'preact/compat'`) is left alone.

So the block is for what the defaults cannot know — an extra alias, declaration output, or a target. Conventional
`src/locales` assets are copied to `dist/locales` automatically by the CLI:

```typescript
export default defineConfig({
	tsdown: { alias: { '#shared': './src/shared' }, dts: true }
});
```

Anything in `tsdown` wins over the defaults, and `plugins` are appended rather than replaced.

With `future.compatibilityVersion: 3` (end-of-life legacy mode) a `tsdown.config.*` in the project root is still
loaded and `tsdown` is merged over it, so a project can move its options across one at a time. From `4` on the block is
the whole configuration, and a leftover `tsdown.config.*` is reported instead of being silently ignored.

`vite: {}` works the same way for `build.tool: 'vite'` (see [experimental flags](#experimental-flags)): it is merged
into the project's own `vite.config.*`, the way `vite: {}` in a Nuxt config is.

### Compatibility version

`future.compatibilityVersion` selects the build-default generation. Version 5 is the default and version 4 remains
supported. Version 3 is **end-of-life**: it still works for projects that have a standalone `tsdown.config.*`, but
every command prints a `COMPATIBILITY_VERSION_EOL` warning, and it is removed in the next major.

```typescript
export default defineConfig({
	future: {
		compatibilityVersion: 4
	}
});
```

| Version       | What it changes                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `3` (EOL)     | Legacy behaviour: a `tsdown.config.*` drives the build, auto imports off unless asked for                                                                |
| `4`           | `tsdown` configured from `stars.config` alone, auto imports on and wired in, `'auto'` picks `tsdown` for TypeScript; [`env`](#environment-env) is opt-in |
| `5` (default) | Everything in `4`, plus [`env`](#environment-env) registered automatically when the project depends on `@wolfstar/env-utilities`                         |

From version 4 on:

- **Auto imports are on** with the `tsdown` build tool, and the `autoImports()` plugin is wired into the build by
  `stars` itself instead of by the project's own configuration file — the framework's exports and the project's
  `src/lib/**`, `src/utils/**` are usable without an `import` statement, the same way Nuxt's own are.
- **`tsdown` is configured from `stars.config` alone.** A `tsdown.config.*` (or a `package.json#tsdown` field) raises
  `TSDOWN_CONFIG_FILE_UNSUPPORTED`, because a build that quietly dropped the plugins such a file declares would be
  far harder to diagnose than an error naming it.
- **`build.tool: 'auto'` resolves to `tsdown`** for any TypeScript entry, rather than looking for a `tsdown.config.*`
  or a `tsdown` dependency first. `tsc` stays available as an explicit choice.

Version 5 adds one thing: **the environment is registered for you.** `stars` calls `setup()` from
`@wolfstar/env-utilities` before any module of the bot runs, so the bot no longer loads its `.env*` files by hand.

`stars info` prints the version in effect, and any warning about it.

### Environment (`env`)

`env` mirrors the options of `setup()` from `@wolfstar/env-utilities`. `stars` writes them into the built entry and
calls `setup()` with them as the entry's very first import — before `@wolfstar/plugin-*` registrations and the bot's
own modules, all of which may read `process.env` as soon as they load.

```typescript
export default defineConfig({
	env: { prefix: 'BOT_', loader: 'varlock' }
});
```

| Option     | Type                    | Default                   |
| ---------- | ----------------------- | ------------------------- |
| `enabled`  | `boolean`               | see below                 |
| `path`     | `string`                | `src/.env*`, then `.env*` |
| `env`      | `string`                | `NODE_ENV`                |
| `prefix`   | `string`                | none                      |
| `loader`   | `'dotenv' \| 'varlock'` | `'dotenv'`                |
| `debug`    | `boolean`               | `false`                   |
| `encoding` | `string`                | `'utf8'`                  |

- `env: false` turns the registration off; `env: true` turns it on with the defaults. Any option at all is an opt-in
  as well, which requires `@wolfstar/env-utilities` in the project's dependencies (`ENV_REQUIRES_ENV_UTILITIES`).
- Without an `env` block it is on from compatibility version 5, when the project depends on
  `@wolfstar/env-utilities`, and off with `experimental.enableNitro` — serverless presets have no `.env` files to load.
- Only the serializable options are mirrored: they end up in the build output as JSON. `path` stays relative and is
  resolved against the bot's working directory at runtime, so the output does not depend on the machine that built it.
- tsdown, Vite and Nitro builds register it through the entry transform. `build.tool: 'tsc'` and `'none'` never pass
  through it: `stars dev` preloads it with `node --import`, but in production such a bot loads its environment itself
  (or runs with `node --import @wolfstar/env-utilities/setup`). The projects `@wolfstar/create-http-framework`
  generates for them set `env: false` and keep calling `setup()` in `src/lib/setup`.
- `stars dev` reads `HTTP_PORT` for the default `dev.url` from the same `path`/`env` files, after `env:options`. With
  `loader: 'varlock'` it reads it, and the tunnel's Discord credentials, from `varlock load` in the project instead —
  run the way the bot loads it, without `env.env`, which varlock ignores.

### Hooks

`hooks` registers lifecycle hooks of the `stars` CLI, run with [`hookable`](https://github.com/unjs/hookable) the way
Nuxt's own `hooks` are. Each hook is keyed by its full name or nested under its namespace, as a function or an array
of functions:

```typescript
export default defineConfig({
	hooks: {
		'env:options'(options) {
			if (process.env.CI) options.path = '.env.ci';
		},
		build: {
			done(outcome) {
				if (!outcome.ok) console.error(outcome.message);
			}
		}
	}
});
```

| Hook              | Arguments           | Runs                                                                  |
| ----------------- | ------------------- | --------------------------------------------------------------------- |
| `config:resolved` | `config`            | after `stars.config` is loaded and validated, in every command        |
| `env:options`     | `options`, `config` | before `env` is written into the build; mutate `options` to change it |
| `prepare:before`  | `config`            | before `.stars/` is generated                                         |
| `prepare:done`    | `config`, `result`  | after `.stars/` is generated                                          |
| `builder:created` | `builder`, `config` | once the builder for `build.tool` exists, before it builds            |
| `tsdown:options`  | `options`, `config` | before `tsdown.build()`; mutate `options` to change the build         |
| `build:before`    | `config`            | before each build (every rebuild in `stars dev`)                      |
| `build:done`      | `outcome`, `config` | after each build, successful or not (`outcome.ok`)                    |
| `dev:start`       | `config`            | once `stars dev` is watching                                          |
| `dev:restart`     | `reason`, `config`  | before `stars dev` (re)starts the bot                                 |
| `dev:close`       | `config`            | when `stars dev` shuts down                                           |

Hooks run in the CLI process, never in the bot — `env:options` is how a hook changes what the bot receives. An unknown
hook name fails with `UNKNOWN_HOOK` rather than registering a hook that never runs. In `stars dev` a hook that throws
is logged and the watcher keeps going; in `stars build` it fails the build.

`stars build` and `stars dev` run them in the same order: `config:resolved` → `env:options` → `builder:created` →
`prepare:before` → `prepare:done`, then `build:before` → `build:done` for each build. `stars dev` adds `dev:start` once
it is watching, `dev:restart` before each (re)start of the bot, and `dev:close` on shutdown. `stars build` awaits every
hook. In `stars dev` the builder drives rebuilds on its own: `build:before` starts when it reports a build, without
delaying it, while `build:done`, `dev:restart` and `dev:close` run one after another — a slow `build:done` settles before
the restart it triggered, and before shutdown. `build:done` gets the final outcome, including a failure to copy
`src/locales`.

### Experimental flags

`experimental` is the same kind of block Nuxt's own `experimental` is: opt-in booleans, all `false` by default, each
guarding work that is still landing.

```typescript
export default defineConfig({
	entry: 'src/main.ts',
	// `build.tool: 'vite'` is only accepted with `enableVite`, and `'auto'` only then detects a vite.config.*
	build: { tool: 'vite' },
	experimental: {
		// Vite as the build tool and the HTTP server, in place of tsdown plus the framework's node:http listener.
		enableVite: true,
		// The project runs Vite itself: `stars dev` only watches the output and restarts the bot.
		enableExternalVite: false,
		// Build and serve through Nitro (itself a Vite plugin) instead of node:http, deployable to any of its
		// presets; the entry's default export must be the `Client` instance, served through `client.fetch(request)`.
		enableNitro: false
	}
});
```

The resolved configuration is also available programmatically:

```typescript
import { loadStarsConfig } from '@wolfstar/http-framework/config';

const config = await loadStarsConfig({ cwd: process.cwd() });
console.log(config.entry, config.build.output);
```

Invalid options raise a `ConfigError` with a stable `code`, the offending option `path`, the `file` it came from, and
an actionable `hint`. See the [`@wolfstar/cli` README](../cli#configuration) for the full option reference and how the
`stars` commands (`dev`, `build`, `info`, `codegen`, `prepare`, `commands`) use it.

### ApplicationCommandRegistry

The `ApplicationCommandRegistry` is `@wolfstar/http-framework`'s centralized registry and uses [`@discordjs/rest`] to register them in Discord.

```typescript
// Assuming you have the code above, and that you called `client.load()`:

// Register all global commands:
await client.registry.pushGlobalCommands();

// Register all the guild-restricted commands:
await client.registry.pushGuildRestrictedCommands();
```

However, if you want to use the registry without the client, you can do so:

```typescript
import { applicationCommandRegistry } from '@wolfstar/http-framework';
import { REST } from '@discordjs/rest';

applicationCommandRegistry.setup({
	rest: new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN),
	clientId: process.env.DISCORD_CLIENT_ID
});

// Load all the commands:
await applicationCommandRegistry.loadCommands();

// Register all global commands:
await applicationCommandRegistry.pushGlobalCommands();

// Register all the guild-restricted commands:
await applicationCommandRegistry.pushGuildRestrictedCommands();
```

> **Note**: calling `applicationCommandRegistry.setup()` is not needed if you are using the `Client` class because it is
> already called automatically for you.

[all of chokidar's options]: https://github.com/paulmillr/chokidar#api
[`node:http`]: https://nodejs.org/api/http.html
[`@discordjs/rest`]: https://www.npmjs.com/package/@discordjs/rest
[`@sapphire/pieces`]: https://www.npmjs.com/package/@sapphire/pieces
[`@sapphire/framework`]: https://sapphirejs.dev/docs/Guide/commands/application-commands/application-command-registry/
