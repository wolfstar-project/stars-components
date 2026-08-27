import type { BaseInteraction } from '../interactions/structures/interactions/base/BaseInteraction.js';
import { createFunctionPrecondition } from './utils.js';

/**
 * The fallback invoked when a context precondition is not met. It receives the same arguments as the decorated method.
 */
export type ContextFallback = (...args: any[]) => unknown;

/**
 * Decorator that only runs the decorated method when the interaction was received from a guild.
 *
 * @param fallback The fallback to run when the interaction did not come from a guild. Defaults to a no-op, which
 * silently skips the method.
 * @returns A method decorator.
 * @example
 * ```typescript
 * import { Command, RegisterCommand, RequiresGuildContext } from '@wolfstar/http-framework';
 *
 * (at)RegisterCommand({ name: 'kick', description: 'Kicks a member' })
 * export class UserCommand extends Command {
 * 	(at)RequiresGuildContext((interaction: Command.ChatInputInteraction) =>
 * 		interaction.reply({ content: 'This command can only be used in a server.' })
 * 	)
 * 	public override chatInputRun(interaction: Command.ChatInputInteraction) {
 * 		return interaction.reply({ content: `Hello from ${interaction.guildId}!` });
 * 	}
 * }
 * ```
 */
export function RequiresGuildContext(fallback: ContextFallback = () => undefined): MethodDecorator {
	return createFunctionPrecondition((interaction: BaseInteraction) => interaction.inGuild(), fallback);
}

/**
 * Decorator that only runs the decorated method when the interaction was **not** received from a guild, that is, from a
 * DM or from a user-installed app context.
 *
 * @param fallback The fallback to run when the interaction came from a guild. Defaults to a no-op, which silently skips
 * the method.
 * @returns A method decorator.
 * @example
 * ```typescript
 * import { Command, RegisterCommand, RequiresDMContext } from '@wolfstar/http-framework';
 *
 * (at)RegisterCommand({ name: 'private', description: 'Only usable outside of servers' })
 * export class UserCommand extends Command {
 * 	(at)RequiresDMContext((interaction: Command.ChatInputInteraction) =>
 * 		interaction.reply({ content: 'This command cannot be used in a server.' })
 * 	)
 * 	public override chatInputRun(interaction: Command.ChatInputInteraction) {
 * 		return interaction.reply({ content: 'Hello!' });
 * 	}
 * }
 * ```
 */
export function RequiresDMContext(fallback: ContextFallback = () => undefined): MethodDecorator {
	return createFunctionPrecondition((interaction: BaseInteraction) => !interaction.inGuild(), fallback);
}
