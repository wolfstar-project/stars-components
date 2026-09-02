import { createColors } from 'colorette';
import { emitKeypressEvents, type Key } from 'node:readline';
import { displayPath } from '@wolfstar/http-framework/config';
import type { DevService, DevStatus } from '../lib/dev-service.js';
import { describeReason } from '../lib/dev-service.js';
import type { LogEntry, LogLevel, LogSource } from '../lib/log-buffer.js';
import { ansi, fit } from './ansi.js';
import type { Renderer } from './plain.js';

export interface TuiRendererOptions {
	stdout?: NodeJS.WriteStream;
	stdin?: NodeJS.ReadStream;
	color?: boolean;
	reducedMotion?: boolean;
	/** Frames per second cap. */
	fps?: number;
}

const SOURCE_FILTERS: (LogSource | null)[] = [null, 'app', 'build', 'stars'];
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

/**
 * Full-screen terminal UI for `stars dev`. Presentation only: every action is delegated to the {@link DevService}.
 */
export function createTuiRenderer(service: DevService, options: TuiRendererOptions = {}): Renderer {
	const stdout = options.stdout ?? process.stdout;
	const stdin = options.stdin ?? process.stdin;
	const colors = createColors({ useColor: options.color ?? true });
	const reducedMotion = options.reducedMotion ?? false;
	const frameInterval = Math.round(1000 / (options.fps ?? 30));
	const name = service.config.packageJson?.name ?? displayPath(service.config.cwd, service.config.root);

	let sourceFilter = 0;
	let minimumLevel: LogLevel | null = null;
	let showHelp = false;
	let scroll = 0; // lines from the bottom
	let frame = 0;
	let timer: NodeJS.Timeout | null = null;
	let ticker: NodeJS.Timeout | null = null;
	let dirty = false;
	let started = false;
	let resolveQuit: (() => void) | null = null;

	const spinner = () => (reducedMotion ? '·' : SPINNER[frame % SPINNER.length]!);

	const paintLevel = (level: LogLevel, text: string) => {
		switch (level) {
			case 'error':
				return colors.red(text);
			case 'warn':
				return colors.yellow(text);
			case 'success':
				return colors.green(text);
			case 'debug':
				return colors.dim(text);
			default:
				return text;
		}
	};

	const paintSource = (source: LogSource) => {
		switch (source) {
			case 'stars':
				return colors.cyan('stars');
			case 'build':
				return colors.magenta('build');
			default:
				return colors.dim('app  ');
		}
	};

	const describeProcess = (status: DevStatus): string => {
		switch (status.process) {
			case 'running':
				return colors.green('● running');
			case 'starting':
				return colors.yellow(`${spinner()} starting`);
			case 'stopping':
				return colors.yellow(`${spinner()} stopping`);
			case 'crashed':
				return colors.red('✖ crashed');
			case 'stopped':
				return colors.dim('○ stopped');
			default:
				return colors.dim('○ waiting for build');
		}
	};

	const describeBuild = (status: DevStatus): string => {
		switch (status.build) {
			case 'building':
				return colors.yellow(`${spinner()} building`);
			case 'ok':
				return colors.green(`✔ build ok${status.lastBuild && status.lastBuild.durationMs > 0 ? ` (${status.lastBuild.durationMs}ms)` : ''}`);
			case 'failed':
				return colors.red(`✖ build failed${status.lastBuild?.message ? `: ${status.lastBuild.message}` : ''}`);
			default:
				return colors.dim('· build idle');
		}
	};

	const describeHealth = (status: DevStatus): string | null => {
		if (!service.config.dev.health) return null;
		switch (status.health) {
			case 'ok':
				return colors.green('health ok');
			case 'down':
				return colors.red('health down');
			default:
				return colors.dim('health unknown');
		}
	};

	const formatEntry = (entry: LogEntry): string => {
		const time = colors.dim(new Date(entry.time).toLocaleTimeString(undefined, { hour12: false }));
		return `${time} ${paintSource(entry.source)} ${paintLevel(entry.level, entry.text)}`;
	};

	const render = (): void => {
		dirty = false;
		const width = Math.max(20, stdout.columns || 80);
		const height = Math.max(6, stdout.rows || 24);
		const status = service.status;
		const narrow = width < 60;

		const uptime = status.startedAt ? formatDuration(Date.now() - status.startedAt) : null;
		const headerParts = [
			colors.bold('★ stars dev'),
			colors.dim(name),
			describeProcess(status),
			status.pid ? colors.dim(`pid ${status.pid}`) : null,
			uptime ? colors.dim(`up ${uptime}`) : null,
			status.restarts > 0
				? colors.dim(`restarts ${status.restarts}${status.lastRestartReason ? ` (${describeReason(status.lastRestartReason)})` : ''}`)
				: null
		].filter((part): part is string => part !== null);

		const statusParts = [describeBuild(status), status.url ? colors.cyan(status.url) : colors.dim('url unknown'), describeHealth(status)].filter(
			(part): part is string => part !== null
		);

		const activeFilter = SOURCE_FILTERS[sourceFilter] ?? null;
		const filterParts = [
			`filter ${activeFilter ?? 'all'}`,
			minimumLevel ? `level ≥ ${minimumLevel}` : null,
			scroll > 0 ? `↑ ${scroll} (End to follow)` : null
		]
			.filter((part): part is string => part !== null)
			.join(' · ');

		const lines: string[] = [];
		const push = (line: string) => lines.push(fit(line, width));
		const separator = colors.dim('─'.repeat(width));

		if (narrow) {
			push(headerParts.slice(0, 3).join(' '));
			push(statusParts.slice(0, 2).join(' '));
		} else {
			push(headerParts.join('  '));
			push(statusParts.join('  '));
		}
		push(separator);

		const footer =
			width < 40
				? [`${colors.bold('h')} help ${colors.bold('q')} quit`]
				: narrow
					? [`${colors.bold('r')} restart ${colors.bold('c')} clear ${colors.bold('h')} help ${colors.bold('q')} quit`]
					: [
							`${colors.bold('r')} restart  ${colors.bold('c')} clear  ${colors.bold('f')} source  ${colors.bold('e')} errors  ${colors.bold('↑↓')} scroll  ${colors.bold('h')} help  ${colors.bold('q')} quit`,
							colors.dim(filterParts)
						];

		const bodyHeight = Math.max(1, height - lines.length - footer.length - 1);
		const entries = service.logs.filter({ source: activeFilter, level: minimumLevel });
		const maxScroll = Math.max(0, entries.length - bodyHeight);
		if (scroll > maxScroll) scroll = maxScroll;

		if (showHelp) {
			const help = helpLines(colors);
			for (let index = 0; index < bodyHeight; index++) push(help[index] ?? '');
		} else if (entries.length === 0) {
			push(colors.dim('  no logs yet'));
			for (let index = 1; index < bodyHeight; index++) push('');
		} else {
			const end = entries.length - scroll;
			const visible = entries.slice(Math.max(0, end - bodyHeight), end);
			for (const entry of visible) push(formatEntry(entry));
			for (let index = visible.length; index < bodyHeight; index++) push('');
		}

		push(separator);
		for (const line of footer) push(line);

		const output = lines.map((line) => `${line}${ansi.eraseLine}`).join('\n');
		stdout.write(`${ansi.cursorHome}${output}${ansi.eraseDown}`);
	};

	const schedule = (): void => {
		if (!started) return;
		dirty = true;
		if (timer) return;
		timer = setTimeout(() => {
			timer = null;
			if (dirty && started) render();
		}, frameInterval);
	};

	const onKeypress = (_: string | undefined, key: Key | undefined): void => {
		if (!key) return;
		const isCtrlC = key.ctrl && key.name === 'c';
		if (isCtrlC || key.name === 'q' || key.name === 'escape') {
			if (showHelp && !isCtrlC) {
				showHelp = false;
				schedule();
				return;
			}
			resolveQuit?.();
			return;
		}

		switch (key.name) {
			case 'r':
				void service.restart('manual');
				break;
			case 'c':
				service.clearLogs();
				scroll = 0;
				break;
			case 'f':
				sourceFilter = (sourceFilter + 1) % SOURCE_FILTERS.length;
				scroll = 0;
				break;
			case 'e':
				minimumLevel = minimumLevel === null ? 'warn' : minimumLevel === 'warn' ? 'error' : null;
				scroll = 0;
				break;
			case 'h':
				showHelp = !showHelp;
				break;
			case 'up':
			case 'k':
				scroll += 1;
				break;
			case 'down':
			case 'j':
				scroll = Math.max(0, scroll - 1);
				break;
			case 'pageup':
				scroll += Math.max(1, (stdout.rows || 24) - 8);
				break;
			case 'pagedown':
				scroll = Math.max(0, scroll - Math.max(1, (stdout.rows || 24) - 8));
				break;
			case 'end':
				scroll = 0;
				break;
			case 'l':
				if (!key.ctrl) return;
				stdout.write(ansi.clearScreen);
				break;
			default:
				if (key.sequence !== '?') return;
				showHelp = !showHelp;
		}

		schedule();
	};

	const onEntry = () => schedule();
	const onStatus = () => schedule();
	const onResize = () => {
		stdout.write(ansi.clearScreen);
		schedule();
	};

	return {
		start() {
			started = true;
			stdout.write(`${ansi.enterAlternateScreen}${ansi.hideCursor}${ansi.clearScreen}`);
			service.logs.on('entry', onEntry);
			service.logs.on('clear', onEntry);
			service.on('status', onStatus);
			stdout.on('resize', onResize);

			emitKeypressEvents(stdin);
			if (stdin.isTTY) stdin.setRawMode(true);
			stdin.resume();
			stdin.on('keypress', onKeypress);

			// Uptime and spinner tick.
			ticker = setInterval(
				() => {
					frame++;
					schedule();
				},
				reducedMotion ? 1000 : 120
			);

			render();
			return new Promise<void>((resolve) => {
				resolveQuit = resolve;
			});
		},
		stop() {
			if (!started) return;
			started = false;
			if (timer) clearTimeout(timer);
			if (ticker) clearInterval(ticker);
			timer = null;
			ticker = null;
			service.logs.off('entry', onEntry);
			service.logs.off('clear', onEntry);
			service.off('status', onStatus);
			stdout.off('resize', onResize);
			stdin.off('keypress', onKeypress);
			if (stdin.isTTY) stdin.setRawMode(false);
			stdin.pause();
			stdout.write(`${ansi.showCursor}${ansi.exitAlternateScreen}`);
		}
	};
}

function helpLines(colors: ReturnType<typeof createColors>): string[] {
	const key = (name: string, description: string) => `  ${colors.bold(name.padEnd(10))}${description}`;
	return [
		colors.bold('  Keys'),
		key('r', 'restart the bot now'),
		key('c', 'clear the log view'),
		key('f', 'cycle the source filter: all › app › build › stars'),
		key('e', 'cycle the level filter: all › warnings › errors'),
		key('↑ ↓ / j k', 'scroll the logs one line'),
		key('PgUp PgDn', 'scroll the logs one page'),
		key('End', 'follow the newest logs again'),
		key('Ctrl+L', 'redraw the screen'),
		key('h / ?', 'toggle this help'),
		key('q / Esc', 'quit (also Ctrl+C)'),
		'',
		colors.dim('  STARS_TUI=plain or --no-tui switches to plain line output, NO_COLOR disables colours,'),
		colors.dim('  STARS_REDUCED_MOTION=1 disables the spinner.')
	];
}

export function formatDuration(milliseconds: number): string {
	const totalSeconds = Math.floor(milliseconds / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const pad = (value: number) => String(value).padStart(2, '0');
	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
