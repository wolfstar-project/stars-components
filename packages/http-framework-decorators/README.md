# `@wolfstar/http-framework-decorators`

Utility decorators for [`@wolfstar/http-framework`](https://github.com/wolfstar-project/stars-components/tree/main/packages/http-framework), inspired by [`@sapphire/decorators`](https://github.com/sapphiredev/utilities/tree/main/packages/decorators) and adapted to HTTP-only Discord interactions.

## Installation

```bash
npm install @wolfstar/http-framework-decorators
# or
pnpm add @wolfstar/http-framework-decorators
```

`@wolfstar/http-framework` is a peer dependency and must be installed alongside it.

The decorators are the legacy TypeScript ones, so `experimentalDecorators` must be enabled in your `tsconfig.json`:

```json
{
	"compilerOptions": {
		"experimentalDecorators": true
	}
}
```

## Usage

### `ApplyOptions`

Sets the options of any `Piece` — `Command`, `Listener`, or `InteractionHandler` — without writing a constructor. The decorator's values are merged on top of the options the piece is constructed with, so they win on conflicting keys.

```typescript
import { Command, RegisterCommand } from '@wolfstar/http-framework';
import { ApplyOptions } from '@wolfstar/http-framework-decorators';

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

### `RequiresGuildContext` / `RequiresDMContext`

Restrict a method to interactions received from a guild, or to interactions received outside of one (DMs and user-installed app contexts). Both take an optional fallback that receives the same arguments as the decorated method; without one, the method is silently skipped and resolves to `undefined`.

```typescript
import { Command, RegisterCommand } from '@wolfstar/http-framework';
import { RequiresGuildContext } from '@wolfstar/http-framework-decorators';

@RegisterCommand({ name: 'kick', description: 'Kicks a member' })
export class UserCommand extends Command {
	@RequiresGuildContext((interaction: Command.ChatInputInteraction) => interaction.reply({ content: 'This command can only be used in a server.' }))
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: `Hello from ${interaction.guildId}!` });
	}
}
```

### `RequiresUserPermissions` / `RequiresClientPermissions`

Check the permissions of the invoking user (`member.permissions`) or of the application (`app_permissions`) in the channel the interaction was sent from. Permissions are given as `PermissionFlagsBits` values, as flag names, or as any nested array of both.

```typescript
import { Command, RegisterCommand } from '@wolfstar/http-framework';
import { RequiresClientPermissions, RequiresUserPermissions } from '@wolfstar/http-framework-decorators';
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

When the check fails, a `MissingPermissionsError` is thrown. Errors thrown from a command are emitted by the client as `commandError` (and as `interactionHandlerError` for interaction handlers), which is the idiomatic place to turn them into a user-facing reply:

```typescript
import { Listener, type ClientEventCommandContext } from '@wolfstar/http-framework';
import { ApplyOptions, MissingPermissionsError } from '@wolfstar/http-framework-decorators';

@ApplyOptions<Listener.Options>({ emitter: 'client', event: 'commandError' })
export class UserListener extends Listener {
	public run(error: unknown, context: ClientEventCommandContext) {
		if (error instanceof MissingPermissionsError) {
			this.container.logger.warn(`${context.command.name}: missing ${error.target} permissions: ${error.missingNames.join(', ')}`);
		}
	}
}
```

Notes on the semantics:

- Members with `Administrator` implicitly satisfy every check.
- `RequiresUserPermissions` passes for interactions received outside of a guild, since there are no guild permissions to check. Combine it with `RequiresGuildContext` when the method must be guild-only.
- `RequiresClientPermissions` passes when `app_permissions` is absent from the payload, since there is nothing to check against.

### `Enumerable` / `EnumerableMethod`

Control whether a field or a method shows up in `Object.keys`, `JSON.stringify`, and console output.

```typescript
import { Command } from '@wolfstar/http-framework';
import { Enumerable } from '@wolfstar/http-framework-decorators';

export class UserCommand extends Command {
	@Enumerable(false)
	declare public cache: Map<string, string>;

	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, options);
		this.cache = new Map();
	}
}
```

> [!IMPORTANT]
> `Enumerable` installs a setter on the prototype, which is bypassed by the `Object.defineProperty` call that `useDefineForClassFields` (enabled by `@sapphire/ts-config`, and the default from `ES2022` onwards) emits for class fields. Mark the field as `declare` so no field definition is emitted, and assign it in the constructor, as shown above.

### Building your own decorators

`createClassDecorator`, `createMethodDecorator`, `createProxy`, and `createFunctionPrecondition` are exported so you can build decorators on the same foundations.

```typescript
import { Command } from '@wolfstar/http-framework';
import { createFunctionPrecondition } from '@wolfstar/http-framework-decorators';

export const RequiresOwner = createFunctionPrecondition(
	(interaction: Command.ChatInputInteraction) => interaction.user.id === process.env.OWNER_ID,
	(interaction: Command.ChatInputInteraction) => interaction.reply({ content: 'Owner only.' })
);
```

> [!NOTE]
> `createFunctionPrecondition` replaces the decorated method with an `async` one, so a decorated method always returns a `Promise`, even when both the precondition and the method are synchronous.

## Exports

| Export                       | Kind     | Description                                                                 |
| ---------------------------- | -------- | --------------------------------------------------------------------------- |
| `ApplyOptions`               | Class    | Sets the options of a `Piece`.                                              |
| `RequiresGuildContext`       | Method   | Runs the method only for guild interactions.                                |
| `RequiresDMContext`          | Method   | Runs the method only for non-guild interactions.                            |
| `RequiresUserPermissions`    | Method   | Runs the method only when the invoking user has the permissions.            |
| `RequiresClientPermissions`  | Method   | Runs the method only when the application has the permissions.              |
| `Enumerable`                 | Property | Sets the `enumerable` flag of a field.                                      |
| `EnumerableMethod`           | Method   | Sets the `enumerable` flag of a method.                                     |
| `createClassDecorator`       | Utility  | Builds a class decorator from a function.                                   |
| `createMethodDecorator`      | Utility  | Builds a method decorator from a function.                                  |
| `createProxy`                | Utility  | Proxies a constructor without subclassing it.                               |
| `createFunctionPrecondition` | Utility  | Builds a method decorator that gates the method behind a predicate.         |
| `MissingPermissionsError`    | Error    | Thrown by the permission decorators when their check fails.                 |
| `Identifiers`                | Constant | The identifiers carried by `MissingPermissionsError`.                       |
| `resolvePermissions`         | Utility  | Resolves a `PermissionResolvable` into a bitfield.                          |
| `getMissingPermissions`      | Utility  | Computes the required permissions that are missing from a granted bitfield. |
| `toPermissionNames`          | Utility  | Converts a bitfield into the list of flag names it contains.                |
