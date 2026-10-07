import { container } from '@sapphire/pieces';
import { Result } from '@sapphire/result';
import type { Awaitable } from '@sapphire/utilities';
import { Identifiers } from '../errors/Identifiers.js';
import { UserError } from '../errors/UserError.js';
import type { Command } from '../structures/Command.js';
import type { InteractionHandler } from '../structures/InteractionHandler.js';
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
 * What a precondition is run for, which decides the method it is asked for: `chatInputRun`, `contextMenuRun`,
 * `autocompleteRun`, or `interactionHandlerRun`.
 *
 * @remarks A piece with no method for a chat input or context menu command denies it. For `autocomplete` and
 * `interactionHandler` it is skipped instead, since a check written for the commands says nothing about their
 * autocomplete or about the components of the bot.
 * @since 6.3.0
 */
export type PreconditionKind = 'chatInput' | 'contextMenu' | 'autocomplete' | 'interactionHandler';

/**
 * The piece a precondition guards: the command, or the interaction handler.
 *
 * @since 6.3.0
 */
export type PreconditionTarget = Command | InteractionHandler;

/**
 * The interactions a precondition can be run for.
 *
 * @since 6.3.0
 */
export type PreconditionInteraction = Command.ApplicationCommandInteraction | Command.AutocompleteInteraction | InteractionHandler.Interaction;

/**
 * A precondition written as a function, for a check that does not need a piece of its own. In the `preconditions` option
 * of a command it is used for chat input and context menu commands, not for their autocomplete. In the option of an
 * interaction handler it is used for the handler.
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
export type PreconditionFunction<Interaction = Command.ApplicationCommandInteraction, Target = Command> = (
	interaction: Interaction,
	target: Target
) => PreconditionResult;

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
export type PreconditionResolvable<Function = PreconditionFunction> = string | PreconditionDetails | Function;

/**
 * Runs a {@link Precondition} piece for the given kind of interaction.
 *
 * @param precondition The precondition to run.
 * @param kind What is being run.
 * @param interaction The interaction being handled.
 * @param target The command or interaction handler being run.
 * @param context The context of the check.
 * @returns The result of the precondition. A chat input or context menu command is denied when the piece has no method
 * for it, an autocomplete or an interaction handler is let through.
 * @since 6.3.0
 */
export function runPrecondition(
	precondition: Precondition,
	kind: PreconditionKind,
	interaction: PreconditionInteraction,
	target: PreconditionTarget,
	context: PreconditionContext = {}
): PreconditionResult {
	switch (kind) {
		case 'chatInput':
			return precondition.chatInputRun
				? precondition.chatInputRun(interaction as Command.ChatInputInteraction, target as Command, context)
				: precondition.error({
						identifier: Identifiers.PreconditionMissingChatInputHandler,
						message: `The precondition "${precondition.name}" is missing a "chatInputRun" handler, but it was requested for the "${target.name}" command.`
					});
		case 'contextMenu':
			return precondition.contextMenuRun
				? precondition.contextMenuRun(interaction as Command.ContextMenuInteraction, target as Command, context)
				: precondition.error({
						identifier: Identifiers.PreconditionMissingContextMenuHandler,
						message: `The precondition "${precondition.name}" is missing a "contextMenuRun" handler, but it was requested for the "${target.name}" command.`
					});
		case 'autocomplete':
			return precondition.autocompleteRun
				? precondition.autocompleteRun(interaction as Command.AutocompleteInteraction, target as Command, context)
				: precondition.ok();
		case 'interactionHandler':
			return precondition.interactionHandlerRun
				? precondition.interactionHandlerRun(interaction as InteractionHandler.Interaction, target as InteractionHandler, context)
				: precondition.ok();
	}
}

/**
 * Runs the preconditions of a command or an interaction handler: first the global ones of the `preconditions` store,
 * then the entries of its `preconditions` option, each one after the other, stopping at the first one that denies it.
 *
 * @remarks An entry that names a precondition missing from the store denies the interaction with
 * {@linkcode Identifiers.PreconditionUnavailable}. The functions of a command are not run for its autocomplete.
 * @param target The command or interaction handler being run.
 * @param kind What is being run.
 * @param interaction The interaction being handled.
 * @returns The first `Err`, or `Result.ok()` when every precondition lets it run.
 * @since 6.3.0
 */
export async function runPreconditions(
	target: PreconditionTarget,
	kind: PreconditionKind,
	interaction: PreconditionInteraction
): Promise<Result<unknown, UserError>> {
	const global = await container.stores.get('preconditions').run(kind, interaction, target);
	if (global.isErr()) return global;

	for (const entry of (target.options.preconditions ?? []) as readonly PreconditionResolvable<
		PreconditionFunction<PreconditionInteraction, PreconditionTarget>
	>[]) {
		const result = await runEntry(entry, kind, interaction, target);
		if (result.isErr()) return result;
	}

	return Result.ok();
}

async function runEntry(
	entry: PreconditionResolvable<PreconditionFunction<PreconditionInteraction, PreconditionTarget>>,
	kind: PreconditionKind,
	interaction: PreconditionInteraction,
	target: PreconditionTarget
): Promise<Result<unknown, UserError>> {
	if (typeof entry === 'function') return kind === 'autocomplete' ? Result.ok() : entry(interaction, target);

	const name = typeof entry === 'string' ? entry : entry.name;
	const precondition = container.stores.get('preconditions').get(name);
	if (!precondition) {
		return Result.err(
			new UserError({ identifier: Identifiers.PreconditionUnavailable, message: `The precondition "${name}" is not available.` })
		);
	}

	return runPrecondition(precondition, kind, interaction, target, typeof entry === 'string' ? {} : (entry.context ?? {}));
}
