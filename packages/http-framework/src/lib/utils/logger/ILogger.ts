/**
 * The available log levels, ordered from the most verbose to the least. A {@link ILogger} only writes the entries
 * whose level is greater than or equal to its configured one, which makes {@link LogLevel.None} a way to silence
 * every entry.
 *
 * @since 3.4.0
 */
export enum LogLevel {
	/**
	 * The lowest level, used for very fine-grained information such as per-interaction traces.
	 */
	Trace = 10,

	/**
	 * The level used for information that is useful while developing, but noisy in production.
	 */
	Debug = 20,

	/**
	 * The default level, used for lifecycle information such as the HTTP server starting.
	 */
	Info = 30,

	/**
	 * The level used for recoverable issues that should be looked at.
	 */
	Warn = 40,

	/**
	 * The level used for errors that were handled but interrupted an operation.
	 */
	Error = 50,

	/**
	 * The level used for errors the process cannot recover from.
	 */
	Fatal = 60,

	/**
	 * A level no entry can reach, silencing the logger entirely.
	 */
	None = 100
}

/**
 * The contract every logger must fulfill to be usable as `container.logger`.
 *
 * The framework ships a minimal {@link Logger} that writes to the console, and expects richer implementations
 * (file transports, structured output, and alike) to be provided by a plugin through
 * {@link ClientLoggerOptions.instance}.
 *
 * @since 3.4.0
 */
export interface ILogger {
	/**
	 * Whether or not the logger writes entries at the given level.
	 * @param level The level to check for.
	 */
	has(level: LogLevel): boolean;

	/**
	 * Writes the values at {@link LogLevel.Trace} level.
	 * @param values The values to log.
	 */
	trace(...values: readonly unknown[]): void;

	/**
	 * Writes the values at {@link LogLevel.Debug} level.
	 * @param values The values to log.
	 */
	debug(...values: readonly unknown[]): void;

	/**
	 * Writes the values at {@link LogLevel.Info} level.
	 * @param values The values to log.
	 */
	info(...values: readonly unknown[]): void;

	/**
	 * Writes the values at {@link LogLevel.Warn} level.
	 * @param values The values to log.
	 */
	warn(...values: readonly unknown[]): void;

	/**
	 * Writes the values at {@link LogLevel.Error} level.
	 * @param values The values to log.
	 */
	error(...values: readonly unknown[]): void;

	/**
	 * Writes the values at {@link LogLevel.Fatal} level.
	 * @param values The values to log.
	 */
	fatal(...values: readonly unknown[]): void;

	/**
	 * Writes the values at the given level, skipping them when {@link ILogger.has} returns `false`.
	 * @param level The level to write the values at.
	 * @param values The values to log.
	 */
	write(level: LogLevel, ...values: readonly unknown[]): void;
}
