<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/decorators

**Useful TypeScript decorators for `@wolfstar/http-framework`, in the spirit of `@sapphire/decorators`.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/decorators)](https://npmx.dev/package/@wolfstar/decorators)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/decorators)](https://npmx.dev/package/@wolfstar/decorators)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

A set of decorators for configuring [`@wolfstar/http-framework`] pieces and gating their methods, modelled after
[`@sapphire/decorators`]. They used to ship with the framework itself; the framework now only keeps the `Register*`
decorators that are part of command registration.

## Installation

```sh
pnpm add @wolfstar/decorators @wolfstar/http-framework
```

`@wolfstar/http-framework` is a peer dependency. The decorators use the legacy (`experimentalDecorators`) decorator
semantics, like the `Register*` decorators of the framework.

## Usage

### `ApplyOptions`

Sets the options of any `Piece` — `Command`, `Listener`, or `InteractionHandler` — without writing a constructor. The
decorator's values are merged on top of the options the piece is constructed with, so they win on conflicting keys.

```typescript
import { ApplyOptions } from '@wolfstar/decorators';
import { Command, RegisterCommand } from '@wolfstar/http-framework';

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
> The `wolfstar/apply-options-decorator-order` rule of `@wolfstar/eslint-plugin-http-framework` enforces this.

### `RequiresGuildContext` / `RequiresDMContext`

Restrict a method to interactions received from a guild, or to interactions received outside of one (DMs and
user-installed app contexts). Both take an optional fallback that receives the same arguments as the decorated method;
without one, the method is silently skipped and resolves to `undefined`.

```typescript
import { RequiresGuildContext } from '@wolfstar/decorators';
import { Command, RegisterCommand } from '@wolfstar/http-framework';

@RegisterCommand({ name: 'kick', description: 'Kicks a member' })
export class UserCommand extends Command {
	@RequiresGuildContext((interaction: Command.ChatInputInteraction) => interaction.reply({ content: 'This command can only be used in a server.' }))
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({ content: `Hello from ${interaction.guildId}!` });
	}
}
```

### `RequiresUserPermissions` / `RequiresClientPermissions`

Check the permissions of the invoking user (`member.permissions`) or of the application (`app_permissions`) in the
channel the interaction was sent from. Permissions are given as `PermissionFlagsBits` values, as flag names, or as any
nested array of both.

```typescript
import { RequiresClientPermissions, RequiresUserPermissions } from '@wolfstar/decorators';
import { Command, RegisterCommand } from '@wolfstar/http-framework';
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
permissions. A `PreconditionError` is a `UserError`, so the client emits it as `chatInputCommandDenied` or
`contextMenuCommandDenied` (and as `interactionHandlerDenied` for interaction handlers) instead of `commandError`, which
is the idiomatic place to turn it into a user-facing reply. `commandError` only receives unexpected errors:

```typescript
import { ApplyOptions } from '@wolfstar/decorators';
import { Identifiers, Listener, PreconditionError, type ClientEventCommandContext, type UserError } from '@wolfstar/http-framework';

@ApplyOptions<Listener.Options>({ emitter: 'client', event: 'chatInputCommandDenied' })
export class UserListener extends Listener {
	public run(error: UserError, context: ClientEventCommandContext) {
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

- Before `@wolfstar/http-framework` 6.3.0 this error reached `commandError`. A listener on that event that handles
  `PreconditionError` must move to the `*Denied` events (see the framework's README).
- Members with `Administrator` implicitly satisfy every check.
- `RequiresUserPermissions` passes for interactions received outside of a guild, since there are no guild permissions to
  check. Combine it with `RequiresGuildContext` when the method must be guild-only.
- `RequiresClientPermissions` passes when `app_permissions` is absent from the payload, since there is nothing to check
  against.

### `Enumerable` / `EnumerableMethod`

Control whether a field or a method shows up in `Object.keys`, `JSON.stringify`, and console output.

```typescript
import { Enumerable } from '@wolfstar/decorators';
import { Command } from '@wolfstar/http-framework';

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

### Building your own decorators

`createClassDecorator`, `createMethodDecorator`, `createProxy`, and `createFunctionPrecondition` are the primitives the
decorators above are built on, and are exported so you can build your own.

```typescript
import { createFunctionPrecondition } from '@wolfstar/decorators';
import type { Command } from '@wolfstar/http-framework';

export const RequiresOwner = createFunctionPrecondition(
	(interaction: Command.ChatInputInteraction) => interaction.user.id === process.env.OWNER_ID,
	(interaction: Command.ChatInputInteraction) => interaction.reply({ content: 'Owner only.' })
);
```

> **Note**: `createFunctionPrecondition` replaces the decorated method with an `async` one, so a decorated method always
> returns a `Promise`, even when both the precondition and the method are synchronous.

## Migrating from `@wolfstar/http-framework` 5.x

Install `@wolfstar/decorators` and move the imports of the utility decorators over; nothing else changes:

```diff
-import { ApplyOptions, Command, RegisterCommand, RequiresGuildContext } from '@wolfstar/http-framework';
+import { ApplyOptions, RequiresGuildContext } from '@wolfstar/decorators';
+import { Command, RegisterCommand } from '@wolfstar/http-framework';
```

Projects using the `stars` CLI's auto imports pick them up without an explicit import, since `@wolfstar/decorators` is
one of the default `imports.presets`.

[`@wolfstar/http-framework`]: https://npmx.dev/package/@wolfstar/http-framework
[`@sapphire/decorators`]: https://www.npmjs.com/package/@sapphire/decorators
