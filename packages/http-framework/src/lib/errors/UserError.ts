/**
 * The UserError class to be thrown and emitted by the pieces of the framework.
 *
 * @remarks
 * This class is the root of every framework-thrown error, allowing consumers to distinguish
 * errors that are meant to be shown to the user from unexpected, internal ones.
 *
 * When a command, an autocomplete handler, or an interaction handler throws a `UserError` (or any subclass), the
 * client emits the matching `*Denied` event ({@link Events.ChatInputCommandDenied}, {@link Events.ContextMenuCommandDenied},
 * {@link Events.AutocompleteDenied}, or {@link Events.InteractionHandlerDenied}) instead of the `*Error` one, so listeners
 * can reply to the user without reporting an expected failure as a bug. Use {@link isUserError} to apply the same check.
 *
 * @property name This will be `'UserError'` and can be used to distinguish the type of error when any error gets thrown.
 * @since 3.2.0
 * @example
 * ```typescript
 * throw new UserError({
 * 	identifier: Identifiers.ArgumentIntegerTooSmall,
 * 	message: 'The number you provided is too small.',
 * 	context: { received: 2, minimum: 3 }
 * });
 * ```
 */
export class UserError extends Error {
	/**
	 * An identifier, useful to localize emitted errors.
	 * @since 3.2.0
	 */
	public readonly identifier: string;

	/**
	 * User-provided context.
	 * @since 3.2.0
	 */
	public readonly context: unknown;

	/**
	 * Constructs an UserError.
	 * @param options The UserError options
	 */
	public constructor(options: UserError.Options) {
		super(options.message);
		this.identifier = options.identifier;
		this.context = options.context ?? null;
	}

	public override get name(): string {
		return 'UserError';
	}
}

export namespace UserError {
	/**
	 * The options for {@link UserError}.
	 * @since 3.2.0
	 */
	export interface Options {
		/**
		 * The identifier for this error.
		 * @since 3.2.0
		 */
		identifier: string;

		/**
		 * The message to be passed to the Error constructor.
		 * @since 3.2.0
		 */
		message?: string;

		/**
		 * The extra context to provide more information about this error.
		 * @since 3.2.0
		 * @default null
		 */
		context?: unknown;
	}
}

/**
 * Checks whether a value is a {@link UserError}, which is how the client tells an expected failure from an unexpected
 * one.
 *
 * @remarks `instanceof` is tried first. A bundle that inlines the framework, or a second installed copy of it, has its
 * own `UserError` class that `instanceof` does not recognise, so any `Error` with a string `identifier` and a `context`
 * property is accepted too.
 * @param error The value to check.
 * @returns Whether the value is a `UserError`.
 * @since 6.3.0
 */
export function isUserError(error: unknown): error is UserError {
	return (
		error instanceof UserError || (error instanceof Error && typeof (error as Partial<UserError>).identifier === 'string' && 'context' in error)
	);
}
