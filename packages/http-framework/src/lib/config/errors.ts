export interface ConfigErrorOptions {
	/** A stable, machine readable code, e.g. `INVALID_TYPE`. */
	code: string;
	/** A short, actionable suggestion. */
	hint?: string;
	/** The dotted path of the offending option, e.g. `dev.debounce`. */
	path?: string;
	/** The configuration file the error originates from. */
	file?: string | null;
	cause?: unknown;
}

/**
 * A `stars.config.*` error: an invalid option, or a file that failed to load or parse.
 *
 * This is a plain data error (no exit code or terminal formatting) so it stays meaningful outside a CLI, e.g. for a
 * dashboard or test that calls {@link loadStarsConfig} directly. `@wolfstar/cli` maps it to exit code `2` and renders
 * `message`, `path`, `file` and `hint` for the terminal.
 */
export class ConfigError extends Error {
	public readonly code: string;
	public readonly hint: string | null;
	public readonly path: string | null;
	public readonly file: string | null;

	public constructor(message: string, options: ConfigErrorOptions) {
		super(message, options.cause === undefined ? undefined : { cause: options.cause });
		this.name = 'ConfigError';
		this.code = options.code;
		this.hint = options.hint ?? null;
		this.path = options.path ?? null;
		this.file = options.file ?? null;
	}
}
