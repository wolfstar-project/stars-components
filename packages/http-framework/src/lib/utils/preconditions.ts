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
 * How the entries of an array of preconditions are run.
 *
 * @since 6.3.0
 */
export enum PreconditionRunMode {
	/**
	 * The entries are run one after the other. This is the default, and it stops as soon as the result is known.
	 * @since 6.3.0
	 */
	Sequential,

	/**
	 * Every entry is started at once and awaited with `Promise.all`, then the results are read. It is faster when the
	 * checks are slow, but none of them is skipped once another one has settled the result.
	 * @since 6.3.0
	 */
	Parallel
}

/**
 * How the results of the entries of an array of preconditions are combined.
 *
 * @since 6.3.0
 */
export enum PreconditionRunCondition {
	/**
	 * Every entry has to pass: the first `Err` is the result.
	 * @since 6.3.0
	 */
	And,

	/**
	 * One entry has to pass: the first `Ok` is the result, and when none does, the last `Err`.
	 * @since 6.3.0
	 */
	Or
}

/**
 * An array of preconditions with the {@link PreconditionRunMode} to run it with.
 *
 * @since 6.3.0
 */
export interface PreconditionArrayDetails<Function = PreconditionFunction> {
	/**
	 * The entries of the array.
	 * @since 6.3.0
	 */
	entries: readonly PreconditionEntryResolvable<Function>[];

	/**
	 * The mode to run the array and the arrays nested in it with.
	 * @since 6.3.0
	 */
	mode: PreconditionRunMode;
}

/**
 * An array of preconditions: a list of entries, or a list with a {@link PreconditionRunMode}.
 *
 * @since 6.3.0
 */
export type PreconditionArrayResolvable<Function = PreconditionFunction> =
	| readonly PreconditionEntryResolvable<Function>[]
	| PreconditionArrayDetails<Function>;

/**
 * An entry of an array of preconditions: a single precondition, or a nested array.
 *
 * @since 6.3.0
 */
export type PreconditionEntryResolvable<Function = PreconditionFunction> = PreconditionResolvable<Function> | PreconditionArrayResolvable<Function>;

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
	return checkPrecondition(precondition, kind, interaction, target, context) ?? precondition.ok();
}

/**
 * Like {@link runPrecondition}, but `null` when the piece does not apply: it has no method for an autocomplete or an
 * interaction handler.
 */
function checkPrecondition(
	precondition: Precondition,
	kind: PreconditionKind,
	interaction: PreconditionInteraction,
	target: PreconditionTarget,
	context: PreconditionContext
): PreconditionResult | null {
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
				: null;
		case 'interactionHandler':
			return precondition.interactionHandlerRun
				? precondition.interactionHandlerRun(interaction as InteractionHandler.Interaction, target as InteractionHandler, context)
				: null;
	}
}

/**
 * Runs the preconditions of a command or an interaction handler: first the global ones of the `preconditions` store,
 * then the entries of its `preconditions` option, stopping at the first denial.
 *
 * @remarks
 * - The `preconditions` option is an array that runs with {@link PreconditionRunCondition.And}: every entry has to pass.
 *   An array nested in it runs with `Or`, one nested in that with `And` again, and so on, so
 *   `['Connect', ['Moderator', ['DJ', 'SongAuthor']]]` is `Connect && (Moderator || (DJ && SongAuthor))`.
 * - The {@link PreconditionRunMode} is `Sequential`, or the `mode` of the array written as `{ entries, mode }`, which the
 *   arrays nested in it inherit.
 * - An entry that names a precondition missing from the store denies the interaction with
 *   {@linkcode Identifiers.PreconditionUnavailable}.
 * - An entry that does not apply to the interaction, such as a function for an autocomplete or a piece with no method for
 *   it, is left out of the result. An array in which no entry applies is left out as well.
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

	const preconditions = (target.options.preconditions ?? []) as PreconditionArrayResolvable<
		PreconditionFunction<PreconditionInteraction, PreconditionTarget>
	>;
	const result = await runArray(preconditions, PreconditionRunCondition.And, PreconditionRunMode.Sequential, kind, interaction, target);
	return result ?? Result.ok();
}

type Outcome = Result<unknown, UserError> | null;
type AnyFunction = PreconditionFunction<PreconditionInteraction, PreconditionTarget>;

async function runArray(
	array: PreconditionArrayResolvable<AnyFunction>,
	condition: PreconditionRunCondition,
	inheritedMode: PreconditionRunMode,
	kind: PreconditionKind,
	interaction: PreconditionInteraction,
	target: PreconditionTarget
): Promise<Outcome> {
	const entries = Array.isArray(array) ? array : (array as PreconditionArrayDetails<AnyFunction>).entries;
	const mode = Array.isArray(array) ? inheritedMode : (array as PreconditionArrayDetails<AnyFunction>).mode;
	const nested = condition === PreconditionRunCondition.And ? PreconditionRunCondition.Or : PreconditionRunCondition.And;

	const run = (entry: PreconditionEntryResolvable<AnyFunction>): Promise<Outcome> =>
		isSingle(entry) ? runSingle(entry, kind, interaction, target) : runArray(entry, nested, mode, kind, interaction, target);

	// In parallel mode every entry is started before any result is read, in sequential mode each one waits for the previous.
	const outcomes = mode === PreconditionRunMode.Parallel ? await Promise.all(entries.map(run)) : null;

	// `null` is an entry that does not apply: it neither passes nor denies, so it cannot settle the result.
	let applied = false;
	let error: Outcome = null;
	for (const [index, entry] of entries.entries()) {
		const outcome = outcomes ? outcomes[index] : await run(entry);
		if (outcome === null) continue;

		applied = true;
		if (condition === PreconditionRunCondition.And) {
			if (outcome.isErr()) return outcome;
		} else if (outcome.isOk()) {
			return outcome;
		} else {
			error = outcome;
		}
	}

	return error ?? (applied ? Result.ok() : null);
}

function isSingle<Function>(entry: PreconditionEntryResolvable<Function>): entry is PreconditionResolvable<Function> {
	return typeof entry === 'string' || typeof entry === 'function' || (!Array.isArray(entry) && 'name' in (entry as object));
}

async function runSingle(
	entry: PreconditionResolvable<AnyFunction>,
	kind: PreconditionKind,
	interaction: PreconditionInteraction,
	target: PreconditionTarget
): Promise<Outcome> {
	if (typeof entry === 'function') return kind === 'autocomplete' ? null : entry(interaction, target);

	const name = typeof entry === 'string' ? entry : entry.name;
	const precondition = container.stores.get('preconditions').get(name);
	if (!precondition) {
		return Result.err(
			new UserError({ identifier: Identifiers.PreconditionUnavailable, message: `The precondition "${name}" is not available.` })
		);
	}

	return checkPrecondition(precondition, kind, interaction, target, typeof entry === 'string' ? {} : (entry.context ?? {}));
}
