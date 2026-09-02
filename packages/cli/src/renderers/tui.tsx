import { render } from 'ink';
import type { DevService } from '../lib/dev-service.js';
import { DevApp } from './ink/DevApp.js';
import type { Renderer } from './plain.js';

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
 * The interactive renderer: an Ink (React) application in the terminal's alternate screen, so the dev session gets
 * its own screen and the user's scrollback survives it.
 *
 * `start()` resolves when the user quits, which is what `stars dev` waits on before shutting the bot down.
 */
export function createTuiRenderer(service: DevService, options: TuiRendererOptions = {}): Renderer {
	const stdout = options.stdout ?? process.stdout;
	const stdin = options.stdin ?? process.stdin;

	let quit!: () => void;
	const quitting = new Promise<void>((resolve) => {
		quit = resolve;
	});

	const instance = render(
		<DevApp service={service} color={options.color ?? false} reducedMotion={options.reducedMotion ?? false} onQuit={quit} />,
		{
			stdout,
			stdin,
			// `createTuiRenderer` only runs once `resolveOutputMode()` already picked 'tui' (never in CI or on a
			// non-TTY stdout), so Ink is told to trust that instead of re-deriving it from `process.env.CI`: on a
			// CI runner that env var is set even for this package's own test process, which would otherwise force
			// Ink's non-interactive mode (no repaint until unmount) despite the fake stdin/stdout looking like a
			// real TTY.
			interactive: true,
			alternateScreen: true,
			// `stars dev` owns the shutdown: it stops the bot, then exits with the right code.
			exitOnCtrlC: false,
			patchConsole: false,
			...(options.fps === undefined ? {} : { maxFps: options.fps })
		}
	);

	return {
		async start() {
			await Promise.race([quitting, instance.waitUntilExit()]);
		},
		stop() {
			instance.unmount();
		}
	};
}

export { formatDuration } from './format.js';
