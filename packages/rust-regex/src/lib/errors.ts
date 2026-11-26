/**
 * The reason a pattern could not be transpiled.
 *
 * - `invalid_syntax`: the Rust `regex` crate would reject the pattern as well.
 * - `unsupported_lookaround`: lookahead and lookbehind do not exist in Rust, so Discord rejects them.
 * - `unsupported_backreference`: backreferences do not exist in Rust, so Discord rejects them.
 * - `unsupported_feature`: valid Rust syntax that this package cannot express with a JavaScript `RegExp`.
 * - `invalid_output`: the pattern was parsed, but the JavaScript engine refuses the result, for example an
 *   unknown Unicode script name, or scoped flags (`(?i:...)`) on a runtime older than ES2025.
 * - `invalid_option`: an option the caller passed is wrong, for example an unknown Rust flag or an unsupported
 *   JavaScript flag in `extraFlags`. The pattern itself is not at fault.
 */
export type RustRegexErrorCode =
	| 'invalid_syntax'
	| 'unsupported_lookaround'
	| 'unsupported_backreference'
	| 'unsupported_feature'
	| 'invalid_output'
	| 'invalid_option';

/**
 * Thrown when a Rust regular expression cannot be transpiled.
 */
export class RustRegexError extends SyntaxError {
	/** What went wrong, so callers can tell a Rust mistake from a limitation of this package. */
	public readonly code: RustRegexErrorCode;

	/** The Rust pattern that was being transpiled. */
	public readonly pattern: string;

	/**
	 * The UTF-16 index in {@link RustRegexError.pattern} where the problem was found, or `undefined` when the problem
	 * is not at a place in the pattern: a wrong option, or a result the JavaScript engine refuses.
	 */
	public readonly position: number | undefined;

	public constructor(code: RustRegexErrorCode, message: string, pattern: string, position?: number) {
		super(position === undefined ? `${message} (in /${pattern}/)` : `${message} (at index ${position} of /${pattern}/)`);
		this.name = 'RustRegexError';
		this.code = code;
		this.pattern = pattern;
		this.position = position;
	}
}
