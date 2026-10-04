import { createColors } from 'colorette';
import type { DevService } from '../dev-service.js';
import { SOURCE_CHANNELS, type LogEntry } from '../../utils/log-buffer.js';
import { initialLogView, matchesView, type LogViewFilter } from './log-view.js';

export interface PlainRendererOptions {
	stdout?: NodeJS.WritableStream;
	color?: boolean;
	/** Whether to attach process signal handlers. */
	signals?: boolean;
	/** Which channels and levels are printed; defaults to `dev.logs`. The log file is never filtered. */
	filter?: LogViewFilter;
}

export interface Renderer {
	/** Starts rendering. Resolves when the user asks to quit (or never, in plain mode without signals). */
	start(): Promise<void>;
	/** Stops rendering and restores the terminal. */
	stop(): void;
}

/**
 * Line-oriented renderer for non-interactive terminals, CI and redirected output.
 */
export function createPlainRenderer(service: DevService, options: PlainRendererOptions = {}): Renderer {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: options.color ?? false });
	const write = (text: string) => stdout.write(`${text}\n`);
	const filter = options.filter ?? initialLogView(service.config);

	const prefixes = {
		stars: colors.cyan('stars'),
		build: colors.magenta('build'),
		tsc: colors.blue('tsc'),
		tunnel: colors.yellow('tunnel'),
		app: null
	} as const;

	const onEntry = (entry: LogEntry) => {
		if (!matchesView(entry, filter)) return;
		// An entry on a channel of its own (`hmr`, `commands`, `http`, …) is prefixed with it; the bot's own output is
		// passed through as it is, so its logger's formatting survives.
		const prefix = entry.channel === SOURCE_CHANNELS[entry.source] ? prefixes[entry.source] : colors.cyan(entry.channel);
		if (!prefix) {
			write(entry.text);
			for (const line of entry.detail ?? []) write(`  ${line}`);
			return;
		}

		const paint =
			entry.level === 'error'
				? colors.red
				: entry.level === 'warn'
					? colors.yellow
					: entry.level === 'success'
						? colors.green
						: (value: string) => value;
		write(`${prefix} ${paint(entry.text)}`);
		for (const line of entry.detail ?? []) write(`${prefix}   ${colors.dim(line)}`);
	};

	const onClear = () => write(`${prefixes.stars} logs cleared`);

	return {
		start() {
			service.logs.on('entry', onEntry);
			service.logs.on('clear', onClear);
			return new Promise<void>(() => {});
		},
		stop() {
			service.logs.off('entry', onEntry);
			service.logs.off('clear', onClear);
		}
	};
}
