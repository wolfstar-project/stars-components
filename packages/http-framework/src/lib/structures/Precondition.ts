import { Piece } from '@sapphire/pieces';
import { Result } from '@sapphire/result';
import { PreconditionError } from '../errors/PreconditionError.js';
import type { PreconditionContext, PreconditionResult } from '../utils/preconditions.js';
import type { Command } from './Command.js';

/**
 * A check that runs before a command method does, loaded from the `preconditions` directory into the
 * `preconditions` store.
 *
 * @remarks A precondition with a `position` is global: it runs, in ascending order of `position`, before the
 * preconditions of every chat input and context menu command. Any other one runs only for the commands that list its
 * name in the `preconditions` option. The method it needs depends on the command, and a precondition that is asked to
 * run for a kind of command it has no method for denies the command with
 * {@linkcode Identifiers.PreconditionMissingChatInputHandler} or
 * {@linkcode Identifiers.PreconditionMissingContextMenuHandler}.
 * @since 6.3.0
 * @example
 * ```typescript
 * import { Precondition } from '@wolfstar/http-framework';
 *
 * export class UserPrecondition extends Precondition {
 * 	public override chatInputRun(interaction: Precondition.ChatInputInteraction) {
 * 		return interaction.user.id === process.env.OWNER_ID ? this.ok() : this.error({ message: 'Only the owner can use this command.' });
 * 	}
 * }
 * ```
 */
export class Precondition<Options extends Precondition.Options = Precondition.Options> extends Piece<Options, 'preconditions'> {
	/**
	 * The position of the precondition in the list of global preconditions, or `null` when it is not global.
	 * @since 6.3.0
	 */
	public readonly position: number | null;

	public constructor(context: Precondition.LoaderContext, options: Options = {} as Options) {
		super(context, options);
		this.position = options.position ?? null;
	}

	/**
	 * Checks a chat input command.
	 *
	 * @param interaction The interaction of the command.
	 * @param command The command that is about to run.
	 * @param context The context of the check: the `context` given in the `preconditions` option of the command.
	 */
	public chatInputRun?(interaction: Precondition.ChatInputInteraction, command: Command, context: Precondition.Context): Precondition.Result;

	/**
	 * Checks a user or message context menu command.
	 *
	 * @param interaction The interaction of the command.
	 * @param command The command that is about to run.
	 * @param context The context of the check: the `context` given in the `preconditions` option of the command.
	 */
	public contextMenuRun?(interaction: Precondition.ContextMenuInteraction, command: Command, context: Precondition.Context): Precondition.Result;

	/**
	 * Lets the command run.
	 * @since 6.3.0
	 */
	public ok(): Precondition.Result {
		return Result.ok();
	}

	/**
	 * Denies the command with a {@link PreconditionError} whose `precondition` is the name of this piece.
	 *
	 * @param options The message, identifier and context of the error.
	 * @since 6.3.0
	 */
	public error(options: Omit<PreconditionError.Options, 'precondition'> = {}): Precondition.Result {
		return Result.err(new PreconditionError({ precondition: this.name, ...options }));
	}
}

/**
 * A {@link Precondition} that has to implement the check for every kind of command.
 *
 * @since 6.3.0
 */
export abstract class AllFlowsPrecondition extends Precondition {
	public abstract override chatInputRun(
		interaction: Precondition.ChatInputInteraction,
		command: Command,
		context: Precondition.Context
	): Precondition.Result;

	public abstract override contextMenuRun(
		interaction: Precondition.ContextMenuInteraction,
		command: Command,
		context: Precondition.Context
	): Precondition.Result;
}

export interface PreconditionOptions extends Piece.Options {
	/**
	 * The position of the precondition in the list of global preconditions. When it is `null`, the precondition is not
	 * global and only runs for the commands that list it.
	 * @since 6.3.0
	 * @default null
	 */
	position?: number | null;
}

export namespace Precondition {
	export type Options = PreconditionOptions;
	export type LoaderContext = Piece.LoaderContext<'preconditions'>;
	export type Context = PreconditionContext;
	export type Result = PreconditionResult;
	export type ChatInputInteraction = Command.ChatInputInteraction;
	export type ContextMenuInteraction = Command.ContextMenuInteraction;
}

export namespace AllFlowsPrecondition {
	export type Options = PreconditionOptions;
	export type LoaderContext = Piece.LoaderContext<'preconditions'>;
	export type Context = PreconditionContext;
	export type Result = PreconditionResult;
}
