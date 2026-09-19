import { configDiagnostics } from '@wolfstar/schema';
import { createColors } from 'colorette';
import { Diagnostic } from 'nostics';
import { ansiFormatter } from 'nostics/formatters/ansi';
import { shouldUseColor } from './output-mode.js';

export const ExitCode = {
	Ok: 0,
	Error: 1,
	InvalidConfig: 2,
	BuildFailed: 3,
	Interrupted: 130,
	Terminated: 143
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

/** Every `stars.config.*` diagnostic code maps to {@link ExitCode.InvalidConfig}; everything else defaults to `Error`. */
const CONFIG_DIAGNOSTIC_CODES = new Set<string>(Object.keys(configDiagnostics));

/** CLI-local diagnostic codes whose exit code isn't the default {@link ExitCode.Error}. */
const CLI_EXIT_CODES: Partial<Record<string, ExitCode>> = {
	BUILD_FAILED: ExitCode.BuildFailed
};

/**
 * Formats an error for the terminal: a `Diagnostic` (from `stars.config.*` validation, via
 * `@wolfstar/schema`'s `configDiagnostics`, or from the CLI's own `cliDiagnostics`) renders through
 * nostics' own ANSI formatter — message, `fix`, `sources` and `docs` — everything else falls back to a crash report.
 */
export async function formatError(error: unknown): Promise<string> {
	if (error instanceof Diagnostic) {
		const colors = createColors({ useColor: shouldUseColor() });
		return ansiFormatter(colors)(error);
	}

	// citty's CLIError (unknown command, missing argument): the message is enough.
	if (error instanceof Error && error.name === 'CLIError') return error.message;
	if (error instanceof Error) return renderCrashReport(error);
	return String(error);
}

/**
 * Renders an unexpected error (a bug, not something the CLI already explains through a `Diagnostic`) as a
 * sourcemapped, syntax-highlighted report — frames and a snippet of the original source instead of a stack trace
 * pointing into the bundled `dist/cli.js`.
 */
export async function renderCrashReport(error: unknown, cwd: string = process.cwd()): Promise<string> {
	const { createReport, fsLoader, renderAnsi } = await import('my-bad');
	const report = await createReport(error, { cwd, loaders: [fsLoader()] });
	return renderAnsi(report, { cwd });
}

export function exitCodeOf(error: unknown): ExitCode {
	if (error instanceof Diagnostic) {
		if (CONFIG_DIAGNOSTIC_CODES.has(error.code)) return ExitCode.InvalidConfig;
		return CLI_EXIT_CODES[error.code] ?? ExitCode.Error;
	}

	return ExitCode.Error;
}
