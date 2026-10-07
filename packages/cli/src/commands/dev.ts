import type { ResolvedStarsConfig } from '@wolfstar/schema';
import { defineCommand } from 'citty';
import { createBuilder } from '../builders/index.js';
import { DevService } from '../dev/dev-service.js';
import { withResolvedLocalhost } from '../dev/host.js';
import { LogFileWriter, runLogFile } from '../dev/log-file.js';
import { initialLogView, isLogLevel } from '../dev/tui/log-view.js';
import { collectFlag, projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { ExitCode, renderCrashReport } from '../utils/errors.js';
import { applyEnvOptions, loadProject, withProjectEnv } from '../utils/hooks.js';
import { prefersReducedMotion, resolveOutputMode, shouldUseColor } from '../utils/output-mode.js';
import { THEME_SETTINGS, isThemeSetting, readSavedTheme, resolveThemeSetting, saveTheme } from '../utils/theme.js';
import { prepareProject, reportWarnings } from './_shared.js';

export interface DevTaskOptions extends ProjectArgs {
	tui?: boolean;
	/** `--theme`. */
	theme?: string;
	/** `--layout`. */
	layout?: string;
	/** `--channel`, each value possibly a comma-separated list. */
	channel?: string[];
	/** `--level`. */
	level?: string;
	/** `--tunnel` opens the tunnel at start whatever `dev.tunnel` says, `--no-tunnel` keeps it closed. */
	tunnel?: boolean;
	/** `--no-mouse` leaves the mouse to the terminal whatever `dev.mouse` says. */
	mouse?: boolean;
}

const LAYOUTS = ['auto', 'dashboard', 'panel'] as const;
const LEVELS = ['trace', 'debug', 'info', 'warn', 'error'] as const;

export async function runDev(options: DevTaskOptions): Promise<void> {
	if (options.theme !== undefined && !isThemeSetting(options.theme)) {
		throw cliDiagnostics.INVALID_THEME({ theme: options.theme, themes: THEME_SETTINGS.join(', ') });
	}

	const layout = options.layout as (typeof LAYOUTS)[number] | undefined;
	if (layout !== undefined && !LAYOUTS.includes(layout)) {
		throw cliDiagnostics.INVALID_OPTION({ option: '--layout', value: options.layout!, allowed: LAYOUTS.join(', ') });
	}

	if (options.level !== undefined && !isLogLevel(options.level)) {
		throw cliDiagnostics.INVALID_OPTION({ option: '--level', value: options.level, allowed: LEVELS.join(', ') });
	}

	// Dev mode applies to config evaluation, build plugins, and the supervised application — not only the child.
	process.env.NODE_ENV = 'development';
	const project = await loadProject({ cwd: resolveCwd(options), configFile: options.config, env: { ...process.env, NODE_ENV: 'development' } });
	const hooks = project.hooks;
	// `env:options` first: it may pick env files with another `HTTP_PORT`, which `dev.url` is derived from.
	const config = await resolveDevConfig(withProjectEnv(await applyEnvOptions(project.config, hooks)));
	const mode = resolveOutputMode({ tui: options.tui });
	const color = shouldUseColor();
	const theme = resolveThemeSetting({ flag: options.theme, saved: readSavedTheme() });

	const builder = await createBuilder(config, hooks);
	await hooks.callHook('builder:created', builder, config);
	const service = new DevService(config, { builder, hooks, openTunnel: options.tunnel });
	await reportWarnings(config, (text) => service.log('stars', 'warn', text), { production: false });
	// The files receive every entry: the filter below only decides what the terminal shows.
	const logFiles = [
		...(config.dev.logFile ? [config.dev.logFile] : []),
		...(config.dev.logs?.dir ? [runLogFile(config.dev.logs.dir, config.dev.logs.keep)] : [])
	].map((file) => new LogFileWriter(file, service.logs));
	for (const file of logFiles) file.open();
	const filter = initialLogView(config, { channels: options.channel, level: options.level });
	const renderer =
		mode === 'tui'
			? (await import('../dev/tui/tui.js')).createTuiRenderer(service, {
					color,
					theme,
					layout,
					filter,
					mouse: options.mouse,
					reducedMotion: prefersReducedMotion(),
					onThemeSave: (setting) => {
						if (!saveTheme(setting)) service.log('stars', 'warn', 'Could not save the theme preference.');
					}
				})
			: (await import('../dev/tui/plain.js')).createPlainRenderer(service, { color, filter });

	let exiting: Promise<never> | null = null;
	const shutdown = (code: ExitCode): Promise<never> => {
		exiting ??= (async () => {
			renderer.stop();
			// A failing hook must not keep the bot running.
			// Behind any hook still running (an async `build:done`), and logged rather than thrown if it fails.
			await service.runHook('dev:close', config);
			await service.stop();
			for (const file of logFiles) file.close();
			process.exit(code);
		})();
		return exiting;
	};

	// Like Turborepo: the first signal shuts down gracefully, a second one gives up waiting and kills everything.
	let signalled = false;
	const onSignal = (code: ExitCode) => () => {
		if (signalled) {
			process.stderr.write('\nForcing shutdown.\n');
			service.kill();
			process.exit(code);
		}

		signalled = true;
		void shutdown(code);
		process.stderr.write('\nShutting down gracefully, press Ctrl+C again to force quit.\n');
	};

	process.on('SIGINT', onSignal(ExitCode.Interrupted));
	process.on('SIGTERM', onSignal(ExitCode.Terminated));
	process.on('SIGHUP', onSignal(ExitCode.Terminated));
	if (process.platform !== 'win32') process.on('SIGUSR2', () => void service.restart('manual'));

	const finished = renderer.start().then(() => shutdown(ExitCode.Ok));
	try {
		await prepareProject(config, hooks);
		await service.start();
		await hooks.callHook('dev:start', config);
	} catch (error) {
		service.log('stars', 'error', error instanceof Error ? await renderCrashReport(error, config.root) : String(error));
		await shutdown(ExitCode.Error);
	}
	await finished;
}

/**
 * Resolves `dev.url`'s `localhost` to the address that is actually reachable (see {@link withResolvedLocalhost}),
 * the way Vite's dev server does when it starts. Only `stars dev` pays this DNS lookup; `stars info`/`stars build`
 * show or use the unresolved config as-is, since they never talk to the bot.
 */
async function resolveDevConfig(config: ResolvedStarsConfig): Promise<ResolvedStarsConfig> {
	if (!config.dev.url) return config;

	const url = await withResolvedLocalhost(config.dev.url);
	return url === config.dev.url ? config : { ...config, dev: { ...config.dev, url } };
}

export default defineCommand({
	meta: {
		name: 'dev',
		description: 'Build, run and restart the bot on changes'
	},
	args: {
		...projectArgs,
		tui: {
			type: 'boolean',
			description: 'Interactive terminal UI; use --no-tui (or STARS_TUI=plain) for plain line output',
			default: true
		},
		theme: {
			type: 'string',
			description: `Colour theme of the interactive UI: ${THEME_SETTINGS.join(', ')} (or STARS_THEME; press T in the UI to pick one)`
		},
		layout: {
			type: 'string',
			description: `Layout of the interactive UI: ${LAYOUTS.join(', ')} (defaults to dev.layout; press v in the UI to switch)`
		},
		channel: {
			type: 'string',
			description: 'Only show these log channels at start (repeatable, or comma-separated; defaults to dev.logs.channels)'
		},
		level: {
			type: 'string',
			description: `Only show this log level and the more severe ones at start: ${LEVELS.join(', ')} (defaults to dev.logs.levels)`
		},
		// No default: left out, `dev.tunnel` decides.
		tunnel: {
			type: 'boolean',
			description: 'Open the public tunnel at start, whatever dev.tunnel says',
			negativeDescription: 'Keep the public tunnel closed at start even when dev.tunnel enables it'
		},
		// No default: left out, `dev.mouse` decides.
		mouse: {
			type: 'boolean',
			description: 'Clickable dashboard and wheel scrolling (defaults to dev.mouse)',
			negativeDescription: 'Leave the mouse to the terminal even when dev.mouse is on'
		}
	},
	async run({ args, rawArgs }) {
		const channel = collectFlag(rawArgs, 'channel');
		await runDev({
			config: args.config,
			cwd: args.cwd,
			tui: args.tui ? undefined : false,
			theme: args.theme,
			layout: args.layout,
			channel: channel.length > 0 ? channel : undefined,
			level: args.level,
			tunnel: args.tunnel,
			mouse: args.mouse
		});
	}
});
