import { ConfigError } from '@wolfstar/http-framework/config';

export const ExitCode = {
	Ok: 0,
	Error: 1,
	InvalidConfig: 2,
	BuildFailed: 3,
	Interrupted: 130,
	Terminated: 143
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

export interface CliErrorOptions {
	/** A stable, machine readable code. */
	code: string;
	/** A short, actionable suggestion. */
	hint?: string;
	exitCode?: ExitCode;
	cause?: unknown;
}

/**
 * An error the CLI reports to the user without a stack trace.
 */
export class CliError extends Error {
	public readonly code: string;
	public readonly hint: string | null;
	public readonly exitCode: ExitCode;

	public constructor(message: string, options: CliErrorOptions) {
		super(message, options.cause === undefined ? undefined : { cause: options.cause });
		this.name = 'CliError';
		this.code = options.code;
		this.hint = options.hint ?? null;
		this.exitCode = options.exitCode ?? ExitCode.Error;
	}
}

/**
 * Formats an error for the terminal: message, optional location and hint.
 *
 * `ConfigError` comes from `@wolfstar/http-framework/config`: the framework validates `stars.config.*` and throws a
 * plain data error, the CLI decides how it looks on a terminal and which exit code it gets ({@link exitCodeOf}).
 */
export function formatError(error: unknown): string {
	if (error instanceof ConfigError) {
		const location = [error.file, error.path ? `option \`${error.path}\`` : null].filter(Boolean).join(' › ');
		return [`${error.message}${location ? ` (${location})` : ''}`, error.hint ? `  hint: ${error.hint}` : null].filter(Boolean).join('\n');
	}

	if (error instanceof CliError) {
		return [error.message, error.hint ? `  hint: ${error.hint}` : null].filter(Boolean).join('\n');
	}

	// citty's CLIError (unknown command, missing argument): the message is enough.
	if (error instanceof Error && error.name === 'CLIError') return error.message;
	if (error instanceof Error) return error.stack ?? error.message;
	return String(error);
}

export function exitCodeOf(error: unknown): ExitCode {
	if (error instanceof ConfigError) return ExitCode.InvalidConfig;
	return error instanceof CliError ? error.exitCode : ExitCode.Error;
}
