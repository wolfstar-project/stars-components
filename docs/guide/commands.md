---
title: Build a command
description: Register and handle Discord commands with the HTTP Framework.
---

# Build a command

Commands extend `Command` and use decorators to describe the application command Discord should register.

## Create a chat input command

```typescript
import { Command, RegisterCommand } from '@wolfstar/http-framework';
import { MessageFlags } from 'discord-api-types/v10';

@RegisterCommand((builder) =>
	builder //
		.setName('ping')
		.setDescription('Replies with pong!')
)
export class PingCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		return interaction.reply({
			content: 'Pong!',
			flags: MessageFlags.Ephemeral
		});
	}
}
```

Place the class in the command directory passed to `client.load()`. The loader discovers the class and adds its builder
to the application-command registry.

## Add subcommands

Use `@RegisterSubcommand` on methods that should receive a specific subcommand:

```typescript
import { Command, RegisterCommand, RegisterSubcommand } from '@wolfstar/http-framework';
import { SlashCommandSubcommandBuilder } from '@discordjs/builders';

@RegisterCommand((builder) => builder.setName('math').setDescription('Perform calculations'))
export class MathCommand extends Command {
	@RegisterSubcommand(
		new SlashCommandSubcommandBuilder()
			.setName('add')
			.setDescription('Add two numbers')
			.addNumberOption((option) => option.setName('left').setDescription('Left value').setRequired(true))
			.addNumberOption((option) => option.setName('right').setDescription('Right value').setRequired(true))
	)
	public add(interaction: Command.ChatInputInteraction, { left, right }: { left: number; right: number }) {
		return interaction.reply({ content: `${left + right}` });
	}
}
```

Subcommand groups, user context-menu commands, message context-menu commands, and guild restrictions use the matching
registration decorators exposed by the package.

## Publish command definitions

After loading pieces, push the registry to Discord:

```typescript
await client.load();
await client.registry.pushGlobalCommands();
await client.registry.pushGuildRestrictedCommands();
await client.listen({ port: 3000 });
```

Global command changes can take time to propagate. Use guild-restricted commands while iterating when you need changes to
appear immediately.

## Test before publishing

The testing package can run the same command class against a local interaction fixture without contacting Discord. See
[Testing interactions](/guide/testing) for a complete example.
