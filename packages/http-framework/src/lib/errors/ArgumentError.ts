import type { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { UserError } from './UserError.js';

/**
 * Errors thrown while resolving the options (arguments) of an interaction.
 *
 * @property name This will be `'ArgumentError'` and can be used to distinguish the type of error when any error gets thrown.
 * @since 3.2.0
 * @example
 * ```typescript
 * throw new ArgumentError({
 * 	argument: 'amount',
 * 	parameter: interaction.options.getInteger('amount'),
 * 	identifier: Identifiers.ArgumentIntegerTooSmall,
 * 	message: 'The amount must be at least 1.',
 * 	context: { minimum: 1 }
 * });
 * ```
 */
export class ArgumentError<T = unknown> extends UserError {
	/**
	 * The name of the option that caused the error.
	 * @since 3.2.0
	 */
	public readonly argument: string;

	/**
	 * The type of the option that caused the error, if known.
	 * @since 3.2.0
	 */
	public readonly type: ApplicationCommandOptionType | null;

	/**
	 * The value that failed to be resolved.
	 * @since 3.2.0
	 */
	public readonly parameter: T;

	public constructor(options: ArgumentError.Options<T>) {
		super({ ...options, identifier: options.identifier ?? options.argument });
		this.argument = options.argument;
		this.type = options.type ?? null;
		this.parameter = options.parameter;
	}

	public override get name(): string {
		return 'ArgumentError';
	}
}

export namespace ArgumentError {
	/**
	 * The options for {@link ArgumentError}.
	 * @since 3.2.0
	 */
	export interface Options<T> extends Omit<UserError.Options, 'identifier'> {
		/**
		 * The name of the option that caused the error.
		 * @since 3.2.0
		 */
		argument: string;

		/**
		 * The type of the option that caused the error.
		 * @since 3.2.0
		 * @default null
		 */
		type?: ApplicationCommandOptionType | null;

		/**
		 * The value that failed to be resolved.
		 * @since 3.2.0
		 */
		parameter: T;

		/**
		 * The identifier.
		 * @since 3.2.0
		 * @default argument
		 */
		identifier?: string;
	}
}
