import { createColors } from 'colorette';
import type { DevService } from '../lib/dev-service.js';
import type { LogEntry } from '../lib/log-buffer.js';

export interface PlainRendererOptions {
	stdout?: NodeJS.WritableStream;
	color?: boolean;
	/** Whether to attach process signal handlers. */
	signals?: boolean;
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

	const prefixes = {
		stars: colors.cyan('stars'),
		build: colors.magenta('build'),
		app: null
	} as const;

	const onEntry = (entry: LogEntry) => {
		const prefix = prefixes[entry.source];
		if (!prefix) {
			write(entry.text);
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
