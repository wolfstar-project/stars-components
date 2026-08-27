# `@wolfstar/http-framework`

A powerful HTTP framework for building your Discord bots, powered by [`node:http`], [`@discordjs/rest`], and [`@sapphire/pieces`].

## Features

- Support for reloading and unloading commands
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

[`node:http`]: https://nodejs.org/api/http.html
[`@discordjs/rest`]: https://www.npmjs.com/package/@discordjs/rest
[`@sapphire/pieces`]: https://www.npmjs.com/package/@sapphire/pieces
[`@sapphire/framework`]: https://sapphirejs.dev/docs/Guide/commands/application-commands/application-command-registry/
