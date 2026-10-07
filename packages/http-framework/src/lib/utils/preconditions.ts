import { container } from '@sapphire/pieces';
import { Result } from '@sapphire/result';
import type { Awaitable } from '@sapphire/utilities';
import { Identifiers } from '../errors/Identifiers.js';
import { UserError } from '../errors/UserError.js';
import type { Command } from '../structures/Command.js';
import type { Precondition } from '../structures/Precondition.js';

/**
 * What a precondition returns: `Result.ok()` to let the command run, or a `Result.err(error)` with a
 * {@link UserError} (usually a `PreconditionError`) to deny it.
 *
 * @since 6.3.0
 */
export type PreconditionResult = Awaitable<Result<unknown, UserError>>;

/**
 * The data a precondition is given besides the interaction and the command.
 *
 * @since 6.3.0
 */
export type PreconditionContext = Record<PropertyKey, unknown>;

/**
 * The kind of command a precondition is run for, which decides the method it is asked for: `chatInputRun` or
 * `contextMenuRun`.
 *
 * @since 6.3.0
 */
export type PreconditionKind = 'chatInput' | 'contextMenu';

/**
 * A precondition written as a function, for a check that does not need a piece of its own. It is used for both kinds of
 * command.
 *
 * @since 6.3.0
 * @example
 * ```typescript
 * import { err, ok } from '@sapphire/result';
 * import { Command, PreconditionError, type PreconditionFunction } from '@wolfstar/http-framework';
 *
 * const OwnerOnly: PreconditionFunction = (interaction) =>
 * 	interaction.user.id === process.env.OWNER_ID
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
export type PreconditionFunction = (interaction: Command.ApplicationCommandInteraction, command: Command) => PreconditionResult;

/**
 * The name of a {@link Precondition} piece, with the context to give it.
 *
 * @since 6.3.0
 */
export interface PreconditionDetails {
	/**
	 * The name of the precondition in the `preconditions` store.
	 * @since 6.3.0
	 */
	name: string;

	/**
	 * The context to give to the precondition.
	 * @since 6.3.0
	 * @default {}
	 */
	context?: PreconditionContext;
}

/**
 * An entry of the `preconditions` option of a command: the name of a {@link Precondition} piece, that name with a
 * context, or a {@link PreconditionFunction}.
 *
 * @since 6.3.0
 */
export type PreconditionResolvable = string | PreconditionDetails | PreconditionFunction;

/**
 * Runs a {@link Precondition} piece for the given kind of command.
 *
 * @param precondition The precondition to run.
 * @param kind The kind of command being run.
 * @param interaction The interaction of the command.
 * @param command The command being run.
 * @param context The context of the check.
 * @returns The result of the precondition, or a denial when it has no method for that kind of command.
 * @since 6.3.0
 */
export function runPrecondition(
	precondition: Precondition,
	kind: PreconditionKind,
	interaction: Command.ApplicationCommandInteraction,
	command: Command,
	context: PreconditionContext = {}
): PreconditionResult {
	if (kind === 'chatInput') {
		return precondition.chatInputRun
			? precondition.chatInputRun(interaction as Command.ChatInputInteraction, command, context)
			: precondition.error({
					identifier: Identifiers.PreconditionMissingChatInputHandler,
					message: `The precondition "${precondition.name}" is missing a "chatInputRun" handler, but it was requested for the "${command.name}" command.`
				});
	}

	return precondition.contextMenuRun
		? precondition.contextMenuRun(interaction as Command.ContextMenuInteraction, command, context)
		: precondition.error({
				identifier: Identifiers.PreconditionMissingContextMenuHandler,
				message: `The precondition "${precondition.name}" is missing a "contextMenuRun" handler, but it was requested for the "${command.name}" command.`
			});
}

/**
 * Runs the preconditions of a command: first the global ones of the `preconditions` store, then the entries of the
 * `preconditions` option of the command, each one after the other, stopping at the first one that denies it.
 *
 * @remarks An entry that names a precondition missing from the store denies the command with
 * {@linkcode Identifiers.PreconditionUnavailable}.
 * @param command The command being run.
 * @param kind The kind of command being run.
 * @param interaction The interaction of the command.
 * @returns The first `Err`, or `Result.ok()` when every precondition lets the command run.
 * @since 6.3.0
 */
export async function runPreconditions(
	command: Command,
	kind: PreconditionKind,
	interaction: Command.ApplicationCommandInteraction
): Promise<Result<unknown, UserError>> {
	const store = container.stores.get('preconditions');

	const global = await store.run(kind, interaction, command);
	if (global.isErr()) return global;

	for (const entry of command.options.preconditions ?? []) {
		const result = await runEntry(entry, kind, interaction, command);
		if (result.isErr()) return result;
	}

	return Result.ok();
}

async function runEntry(
	entry: PreconditionResolvable,
	kind: PreconditionKind,
	interaction: Command.ApplicationCommandInteraction,
	command: Command
): Promise<Result<unknown, UserError>> {
	if (typeof entry === 'function') return entry(interaction, command);

	const name = typeof entry === 'string' ? entry : entry.name;
	const precondition = container.stores.get('preconditions').get(name);
	if (!precondition) {
		return Result.err(
			new UserError({ identifier: Identifiers.PreconditionUnavailable, message: `The precondition "${name}" is not available.` })
		);
	}

	return runPrecondition(precondition, kind, interaction, command, typeof entry === 'string' ? {} : (entry.context ?? {}));
}
