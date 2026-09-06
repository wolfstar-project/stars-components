import { render } from 'ink';
import type { DevService } from '../lib/dev-service.js';
import { DevApp } from './ink/DevApp.js';
import type { Renderer } from './plain.js';
import { captureOutput } from './capture-output.js';
import { isErrorDetail } from '../lib/log-buffer.js';

export interface TuiRendererOptions {
	stdout?: NodeJS.WriteStream;
	stdin?: NodeJS.ReadStream;
	color?: boolean;
	/** Freezes spinners, for `STARS_REDUCED_MOTION=1`. */
	reducedMotion?: boolean;
	/** Caps how often Ink repaints; the default is Ink's own. */
	fps?: number;
}

/**
 * A normal-buffer, bottom-aligned panel and alternate-buffer overlays. External output is captured for the log
 * browser; the renderer alone writes to the terminal. Switching views and teardown restore the original buffer.
 *
 * `start()` resolves when the user quits, which is what `stars dev` waits on before shutting the bot down.
 */
export function createTuiRenderer(service: DevService, options: TuiRendererOptions = {}): Renderer {
	const stdout = options.stdout ?? process.stdout;
	const stdin = options.stdin ?? process.stdin;
	const write = stdout.write.bind(stdout);
	// Bind methods to the real stream (resize subscriptions included), except write which bypasses capture.
	const sink = new Proxy(stdout, {
		get(target, property) {
			if (property === 'write') return write;
			const value = Reflect.get(target, property, target);
			return typeof value === 'function' ? value.bind(target) : value;
		}
	});
	const restoreOutput =
		stdout === process.stdout ? [captureOutput(service, process.stdout, 'info'), captureOutput(service, process.stderr, 'warn')] : [];
	let alternate = false;
	let stopped = false;
	const switchView = (overlay: boolean) => {
		if (overlay === alternate || stopped) return;
		instance.clear();
		write(overlay ? '\u001B[?1049h\u001B[H' : '\u001B[?1049l');
		alternate = overlay;
	};

	let quit!: () => void;
	const quitting = new Promise<void>((resolve) => {
		quit = resolve;
	});

	const instance = render(
		<DevApp
			service={service}
			color={options.color ?? false}
			reducedMotion={options.reducedMotion ?? false}
			onQuit={quit}
			onViewChange={switchView}
			onCopy={(text) => write(`\u001B]52;c;${Buffer.from(text.slice(0, 65536)).toString('base64')}\u0007`)}
		/>,
		{
			stdout: sink,
			stdin,
			// `stars dev` owns the shutdown: it stops the bot, then exits with the right code.
			exitOnCtrlC: false,
			patchConsole: false,
			// `createTuiRenderer` only runs once `resolveOutputMode()` already picked 'tui' (never in CI or on a
			// non-TTY stdout), so Ink is told to trust that instead of re-deriving it from `process.env.CI`: on a
			// CI runner that env var is set even for this package's own test process, which would otherwise force
			// Ink's non-interactive mode (no repaint until unmount) despite the fake stdin/stdout looking like a
			// real TTY.
			interactive: true,
			...(options.fps === undefined ? {} : { maxFps: options.fps })
		}
	);

	return {
		async start() {
			await Promise.race([quitting, instance.waitUntilExit()]);
		},
		stop() {
			if (stopped) return;
			stopped = true;
			if (alternate) instance.clear();
			instance.unmount();
			if (alternate) write('\u001B[?1049l');
			write('\u001B[?25h');
			for (const restore of restoreOutput) restore();
			// A fatal startup must not leave the user with only a folded error and no way to read it.
			if (service.status.progress.readyMs === null) {
				const error = service.logs.entries().findLast((entry) => entry.level === 'error' && !isErrorDetail(entry));
				if (error) write(`\n${error.text}\n`);
			}
			quit();
		}
	};
}

export { formatDuration } from './panel-logic.js';
