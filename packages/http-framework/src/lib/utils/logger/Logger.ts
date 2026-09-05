import { LogLevel, type ILogger } from './ILogger.js';

/**
 * The default {@link ILogger} implementation, writing every entry to the matching `console` method.
 *
 * It is intentionally minimal: it only filters by {@link Logger.level} and forwards the values as-is, leaving
 * timestamps, colours, and transports to a logger plugin that replaces `container.logger` through
 * {@link ClientLoggerOptions.instance}.
 *
 * @since 3.4.0
 */
export class Logger implements ILogger {
	/**
	 * The lowest level the logger writes.
	 */
	public level: LogLevel;

	/**
	 * @param level The lowest level the logger writes.
	 */
	public constructor(level: LogLevel = LogLevel.Info) {
		this.level = level;
	}

	public has(level: LogLevel): boolean {
		return level >= this.level;
	}

	public trace(...values: readonly unknown[]): void {
		this.write(LogLevel.Trace, ...values);
	}

	public debug(...values: readonly unknown[]): void {
		this.write(LogLevel.Debug, ...values);
	}

	public info(...values: readonly unknown[]): void {
		this.write(LogLevel.Info, ...values);
	}

	public warn(...values: readonly unknown[]): void {
		this.write(LogLevel.Warn, ...values);
	}

	public error(...values: readonly unknown[]): void {
		this.write(LogLevel.Error, ...values);
	}

	public fatal(...values: readonly unknown[]): void {
		this.write(LogLevel.Fatal, ...values);
	}

	public write(level: LogLevel, ...values: readonly unknown[]): void {
		if (!this.has(level)) return;

		const method = Logger.levels.get(level);
		if (method) console[method](...values);
	}

	/**
	 * The `console` method each level is written with.
	 */
	protected static readonly levels = new Map<LogLevel, LoggerConsoleMethod>([
		[LogLevel.Trace, 'trace'],
		[LogLevel.Debug, 'debug'],
		[LogLevel.Info, 'info'],
		[LogLevel.Warn, 'warn'],
		[LogLevel.Error, 'error'],
		[LogLevel.Fatal, 'error']
	]);
}

/**
 * The `console` methods {@link Logger} can write to.
 *
 * @since 3.4.0
 */
export type LoggerConsoleMethod = 'debug' | 'error' | 'info' | 'trace' | 'warn';
