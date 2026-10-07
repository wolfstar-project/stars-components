import { Result } from '@sapphire/result';
import type { Awaitable } from '@sapphire/utilities';
import type { UserError } from '../errors/UserError.js';
import type { Command } from '../structures/Command.js';

/**
 * What a {@link Precondition} returns: `Result.ok()` to let the command run, or a `Result.err(error)` with a
 * {@link UserError} (usually a `PreconditionError`) to deny it.
 *
 * @since 6.3.0
 */
export type PreconditionResult = Awaitable<Result<unknown, UserError>>;

/**
 * A check that runs before a command method does, listed in the `preconditions` option of the command.
 *
 * @remarks This is the `@sapphire/framework` precondition reduced to what an HTTP bot has: a plain function, with no
 * store, no global preconditions, and no message flow. When it returns an `Err`, the command method is not run and the
 * error is emitted as `chatInputCommandDenied` or `contextMenuCommandDenied`, like a `UserError` the command throws.
 * Anything else it throws is emitted as `commandError`.
 * @since 6.3.0
 * @example
 * ```typescript
 * import { err, ok } from '@sapphire/result';
 * import { Command, PreconditionError, type Precondition } from '@wolfstar/http-framework';
 *
 * const OwnerOnly: Precondition = (interaction) =>
 * 	interaction.user.id === '737141877803057244'
 * 		? ok()
 * 		: err(new PreconditionError({ precondition: 'OwnerOnly', message: 'Only the owner can use this command.' }));
 *
 * export class UserCommand extends Command {
 * 	public constructor(context: Command.LoaderContext, options: Command.Options) {
 * 		super(context, { ...options, preconditions: [OwnerOnly] });
 * 	}
 * }
 * ```
 */
export type Precondition = (interaction: Command.ApplicationCommandInteraction, command: Command) => PreconditionResult;

/**
 * Runs the preconditions of a command one after the other, stopping at the first one that denies it.
 *
 * @param preconditions The preconditions to run.
 * @param interaction The interaction of the command being run.
 * @param command The command being run.
 * @returns The first `Err`, or `Result.ok()` when every precondition lets the command run.
 * @since 6.3.0
 */
export async function runPreconditions(
	preconditions: readonly Precondition[],
	interaction: Command.ApplicationCommandInteraction,
	command: Command
): Promise<Result<unknown, UserError>> {
	for (const precondition of preconditions) {
		const result = await precondition(interaction, command);
		if (result.isErr()) return result;
	}

	return Result.ok();
}
