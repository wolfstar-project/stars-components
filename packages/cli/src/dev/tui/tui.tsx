import { render } from 'ink';
import type { DevService } from '../dev-service.js';
import { DevApp, resolveLayout, type DevLayout } from './ink/DevApp.js';
import type { LogViewFilter } from './log-view.js';
import { createMouseInput, DISABLE_MOUSE, ENABLE_MOUSE } from './mouse.js';
import type { Renderer } from './plain.js';
import { captureOutput } from './capture-output.js';
import { isErrorDetail } from '../../utils/log-buffer.js';
import type { ThemeSetting } from '../../utils/theme.js';

export interface TuiRendererOptions {
	stdout?: NodeJS.WriteStream;
	stdin?: NodeJS.ReadStream;
	color?: boolean;
	/** Defaults to `auto`. */
	theme?: ThemeSetting;
	/** Called when the user keeps a theme in the picker. */
	onThemeSave?: (setting: ThemeSetting) => void;
	/** Freezes spinners, for `STARS_REDUCED_MOTION=1`. */
	reducedMotion?: boolean;
	/** Caps how often Ink repaints; the default is Ink's own. */
	fps?: number;
	/** `--layout`; defaults to `dev.layout`. */
	layout?: DevLayout | 'auto';
	/** The log filter the dashboard starts with; defaults to `dev.logs`. */
	filter?: LogViewFilter;
	/** `--no-mouse`; defaults to `dev.mouse`. */
	mouse?: boolean;
}

/**
 * The full-screen dashboard and the overlays in the alternate buffer, the bottom-aligned panel in the normal one.
 * External output is captured for the log views; the renderer alone writes to the terminal. Switching views and
 * teardown restore the original buffer.
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
	const layout = options.layout ?? service.config.dev.layout ?? 'auto';
	// The dashboard is painted from the first frame, so its buffer is entered before Ink writes anything.
	let alternate = resolveLayout(layout, stdout.columns ?? 80, stdout.rows ?? 24) === 'dashboard';
	const mouse = (options.mouse ?? service.config.dev.mouse) ? createMouseInput(stdin) : null;
	// The mouse is only reported while the dashboard is on screen: the panel and the overlays leave the terminal its
	// own wheel and text selection.
	let reporting = false;
	const reportMouse = (wanted: boolean) => {
		if (!mouse || wanted === reporting) return;
		reporting = wanted;
		write(wanted ? ENABLE_MOUSE : DISABLE_MOUSE);
	};
	if (alternate) write('\u001B[?1049h\u001B[H');
	let stopped = false;
	const switchView = (fullScreen: boolean) => {
		if (fullScreen === alternate || stopped) return;
		instance.clear();
		write(fullScreen ? '\u001B[?1049h\u001B[H' : '\u001B[?1049l');
		alternate = fullScreen;
	};
	// Only an interactive UI can answer the bot's questions (`Refresh commands?`).
	service.promptable = true;

	let quit!: () => void;
	const quitting = new Promise<void>((resolve) => {
		quit = resolve;
	});

	const instance = render(
		<DevApp
			service={service}
			color={options.color ?? false}
			theme={options.theme ?? 'auto'}
			onThemeSave={options.onThemeSave ?? (() => {})}
			reducedMotion={options.reducedMotion ?? false}
			layout={layout}
			filter={options.filter}
			onQuit={quit}
			onViewChange={switchView}
			onCopy={(text) => write(`\u001B]52;c;${Buffer.from(text.slice(0, 65536)).toString('base64')}\u0007`)}
			mouse={mouse ?? undefined}
			onMouseChange={(wanted) => {
				if (!stopped) reportMouse(wanted);
			}}
		/>,
		{
			stdout: sink,
			stdin: mouse?.stdin ?? stdin,
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
			service.promptable = false;
			if (alternate) instance.clear();
			instance.unmount();
			reportMouse(false);
			if (alternate) write('\u001B[?1049l');
			mouse?.dispose();
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
