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

Besides the `Register*` decorators, the framework ships a set of utility decorators for configuring pieces and gating
methods.

#### `ApplyOptions`

Sets the options of any `Piece` — `Command`, `Listener`, or `InteractionHandler` — without writing a constructor. The
decorator's values are merged on top of the options the piece is constructed with, so they win on conflicting keys.

```typescript
import { ApplyOptions, Command, RegisterCommand } from '@wolfstar/http-framework';

@ApplyOptions<Command.Options>({ name: 'ping', enabled: true })
@RegisterCommand({ name: 'ping', description: 'A simple ping pong command' })
export class UserCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: 'Pong!' });
	}
}
```

It also accepts a function, which receives the loader context:

```typescript
@ApplyOptions<Command.Options>(({ name }) => ({ name: name.toLowerCase() }))
export class UserCommand extends Command {}
```

> **Note**: `ApplyOptions` returns a `Proxy` wrapping the class, so it must be applied above (outside of) any other class
> decorator that keys metadata by class identity, such as `RegisterCommand` — as in the example above. A decorator
> applied above `ApplyOptions` would run after it and register against the proxy, but instances constructed from the
> exported class still resolve `.constructor` to the original, unproxied class, so that metadata could never be found.

#### `RequiresGuildContext` / `RequiresDMContext`

Restrict a method to interactions received from a guild, or to interactions received outside of one (DMs and
user-installed app contexts). Both take an optional fallback that receives the same arguments as the decorated method;
without one, the method is silently skipped and resolves to `undefined`.

```typescript
import { Command, RegisterCommand, RequiresGuildContext } from '@wolfstar/http-framework';

@RegisterCommand({ name: 'kick', description: 'Kicks a member' })
export class UserCommand extends Command {
	@RequiresGuildContext((interaction: Command.ChatInputInteraction) => interaction.reply({ content: 'This command can only be used in a server.' }))
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: `Hello from ${interaction.guildId}!` });
	}
}
```

#### `RequiresUserPermissions` / `RequiresClientPermissions`

Check the permissions of the invoking user (`member.permissions`) or of the application (`app_permissions`) in the
channel the interaction was sent from. Permissions are given as `PermissionFlagsBits` values, as flag names, or as any
nested array of both.

```typescript
import { Command, RegisterCommand, RequiresClientPermissions, RequiresUserPermissions } from '@wolfstar/http-framework';
import { PermissionFlagsBits } from 'discord-api-types/v10';

@RegisterCommand({ name: 'purge', description: 'Deletes messages' })
export class UserCommand extends Command {
	@RequiresUserPermissions('ManageMessages')
	@RequiresClientPermissions(PermissionFlagsBits.ManageMessages, 'ReadMessageHistory')
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: 'Purging!' });
	}
}
```

When the check fails, a `PreconditionError` is thrown, identified by `Identifiers.PreconditionUserPermissions` or
`Identifiers.PreconditionClientPermissions`, with `context: { missing, missingNames }` describing the missing
permissions. Errors thrown from a command are emitted as `commandError` (and as `interactionHandlerError` for
interaction handlers), which is the idiomatic place to turn them into a user-facing reply:

```typescript
import { ApplyOptions, Identifiers, Listener, PreconditionError, type ClientEventCommandContext } from '@wolfstar/http-framework';

@ApplyOptions<Listener.Options>({ emitter: 'client', event: 'commandError' })
export class UserListener extends Listener {
	public run(error: unknown, context: ClientEventCommandContext) {
		if (
			error instanceof PreconditionError &&
			(error.identifier === Identifiers.PreconditionUserPermissions || error.identifier === Identifiers.PreconditionClientPermissions)
		) {
			const { missingNames } = error.context as { missingNames: string[] };
			this.container.logger.warn(`${context.command.name}: missing ${error.precondition}: ${missingNames.join(', ')}`);
		}
	}
}
```

Notes on the semantics:

- Members with `Administrator` implicitly satisfy every check.
- `RequiresUserPermissions` passes for interactions received outside of a guild, since there are no guild permissions to
  check. Combine it with `RequiresGuildContext` when the method must be guild-only.
- `RequiresClientPermissions` passes when `app_permissions` is absent from the payload, since there is nothing to check
  against.

#### `Enumerable` / `EnumerableMethod`

Control whether a field or a method shows up in `Object.keys`, `JSON.stringify`, and console output.

```typescript
import { Command, Enumerable } from '@wolfstar/http-framework';

export class UserCommand extends Command {
	@Enumerable(false)
	declare public cache: Map<string, string>;

	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, options);
		this.cache = new Map();
	}
}
```

> **Note**: `Enumerable` installs a setter on the prototype, which is bypassed by the `Object.defineProperty` call that
> `useDefineForClassFields` (enabled by `@sapphire/ts-config`, and the default from `ES2022` onwards) emits for class
> fields. Mark the field as `declare` so no field definition is emitted, and assign it in the constructor.

#### Building your own decorators

`createClassDecorator`, `createMethodDecorator`, `createProxy`, and `createFunctionPrecondition` are the primitives the
decorators above — and the `Register*` ones — are built on, and are exported so you can build your own.

```typescript
import { Command, createFunctionPrecondition } from '@wolfstar/http-framework';

export const RequiresOwner = createFunctionPrecondition(
	(interaction: Command.ChatInputInteraction) => interaction.user.id === process.env.OWNER_ID,
	(interaction: Command.ChatInputInteraction) => interaction.reply({ content: 'Owner only.' })
);
```

> **Note**: `createFunctionPrecondition` replaces the decorated method with an `async` one, so a decorated method always
> returns a `Promise`, even when both the precondition and the method are synchronous.

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
import { ApplyOptions, Events, Listener } from '@wolfstar/http-framework';

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

`@wolfstar/http-framework` owns the typed project configuration consumed by the [`stars` CLI](../cli) — the
`defineConfig` helper and the config loader live here, not in the CLI, so any tool can resolve a project's
configuration without pulling in `@wolfstar/cli`.

```typescript
// stars.config.ts
import { defineConfig } from '@wolfstar/http-framework/config';

export default defineConfig({
	entry: 'src/main.ts',
	build: { tool: 'tsdown' }
});
```

`@wolfstar/http-framework/config` has no side effects — importing it (or a `stars.config.ts` that imports it) never
starts the bot. `loadStarsConfig` discovers `stars.config.{ts,mts,cts,js,mjs,cjs}` from a directory, applies defaults,
validates every option and resolves all paths to absolute ones.

`dev.url`, the URL `stars dev` shows and health-checks the bot on, needs no configuration either: it is detected the
way Vite's and Nuxt's dev servers are, from `HTTP_PORT` (env var, `.env.local`/`.env`, or `dev.env`) or `3000`, and
`localhost` is swapped for `127.0.0.1` at runtime if that is what is actually reachable. Set `dev.url` explicitly only
to override it, e.g. for a LAN address: `dev: { url: 'http://192.168.1.5:3000' }`.

`dev` also carries the three options that round out the dev loop:

```typescript
export default defineConfig({
	entry: 'src/main.ts',
	build: { tool: 'tsdown' },
	dev: {
		// A type checker next to the bot, reported on the dev UI's `tsc` channel. Never blocks a build.
		// `checker` is 'tsc' | 'golar' | 'tsz' | 'auto' (default: golar when installed, tsc otherwise).
		typecheck: { checker: 'golar' },
		// A cloudflared quick tunnel so Discord can reach the interactions endpoint, or an https URL you serve.
		tunnel: true,
		// Where the session's logs are mirrored, so a run can be read after the terminal UI is gone.
		logFile: '.stars/dev.log'
	}
});
```

`tunnel.updateEndpoint` writes the public URL to the Discord application's `interactions_endpoint_url`; it is opt-in
because it edits a live application, and needs `DISCORD_TOKEN` in the environment or the project's `.env`.

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
		// Build and serve through Nitro. Needs the framework's Fetch adapter, so `stars dev`/`stars build` still
		// refuse it with an actionable error for now.
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
