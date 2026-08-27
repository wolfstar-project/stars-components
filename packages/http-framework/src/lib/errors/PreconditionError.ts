import { UserError } from './UserError.js';

/**
 * Errors thrown by preconditions, that is, any check that runs before a command or an interaction
 * handler is executed, such as the guild restrictions applied by
 * {@link RestrictGuildIds}.
 *
 * @property name This will be `'PreconditionError'` and can be used to distinguish the type of error when any error gets thrown.
 * @since 3.2.0
 * @example
 * ```typescript
 * throw new PreconditionError({
 * 	precondition: 'GuildIds',
 * 	identifier: Identifiers.PreconditionGuildIds,
 * 	message: 'This command can only be used in specific guilds.',
 * 	context: { guildIds: ['737141877803057244'] }
 * });
 * ```
 */
export class PreconditionError extends UserError {
	/**
	 * The name of the precondition that caused the error.
	 * @since 3.2.0
	 */
	public readonly precondition: string;

	public constructor(options: PreconditionError.Options) {
		super({ ...options, identifier: options.identifier ?? options.precondition });
		this.precondition = options.precondition;
	}

	public override get name(): string {
		return 'PreconditionError';
	}
}

export namespace PreconditionError {
	/**
	 * The options for {@link PreconditionError}.
	 * @since 3.2.0
	 */
	export interface Options extends Omit<UserError.Options, 'identifier'> {
		/**
		 * The name of the precondition that caused the error.
		 * @since 3.2.0
		 */
		precondition: string;

		/**
		 * The identifier.
		 * @since 3.2.0
		 * @default precondition
		 */
		identifier?: string;
	}
}
