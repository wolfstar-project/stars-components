import { loadStarsConfig, type ResolvedStarsConfig } from '@wolfstar/schema';
import { defineCommand } from 'citty';
import { createBuilder } from '../builders/index.js';
import { DevService } from '../dev/dev-service.js';
import { withResolvedLocalhost } from '../dev/host.js';
import { LogFileWriter } from '../dev/log-file.js';
import { projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { ExitCode, renderCrashReport } from '../utils/errors.js';
import { prefersReducedMotion, resolveOutputMode, shouldUseColor } from '../utils/output-mode.js';
import { THEME_SETTINGS, isThemeSetting, readSavedTheme, resolveThemeSetting, saveTheme } from '../utils/theme.js';
import { prepareProject } from './_shared.js';

export interface DevTaskOptions extends ProjectArgs {
	tui?: boolean;
	/** `--theme`. */
	theme?: string;
}

export async function runDev(options: DevTaskOptions): Promise<void> {
	if (options.theme !== undefined && !isThemeSetting(options.theme)) {
		throw cliDiagnostics.INVALID_THEME({ theme: options.theme, themes: THEME_SETTINGS.join(', ') });
	}

	// Dev mode applies to config evaluation, build plugins, and the supervised application — not only the child.
	process.env.NODE_ENV = 'development';
	const config = await resolveDevConfig(
		await loadStarsConfig({ cwd: resolveCwd(options), configFile: options.config, env: { ...process.env, NODE_ENV: 'development' } })
	);
	const mode = resolveOutputMode({ tui: options.tui });
	const color = shouldUseColor();
	const theme = resolveThemeSetting({ flag: options.theme, saved: readSavedTheme() });

	const service = new DevService(config, { builder: await createBuilder(config) });
	const logFile = config.dev.logFile ? new LogFileWriter(config.dev.logFile, service.logs) : null;
	logFile?.open();
	const renderer =
		mode === 'tui'
			? (await import('../dev/tui/tui.js')).createTuiRenderer(service, {
					color,
					theme,
					reducedMotion: prefersReducedMotion(),
					onThemeSave: (setting) => {
						if (!saveTheme(setting)) service.log('stars', 'warn', 'Could not save the theme preference.');
					}
				})
			: (await import('../dev/tui/plain.js')).createPlainRenderer(service, { color });

	let exiting: Promise<never> | null = null;
	const shutdown = (code: ExitCode): Promise<never> => {
		exiting ??= (async () => {
			renderer.stop();
			await service.stop();
			logFile?.close();
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
		await prepareProject(config);
		await service.start();
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
		}
	},
	async run({ args }) {
		await runDev({ config: args.config, cwd: args.cwd, tui: args.tui ? undefined : false, theme: args.theme });
	}
});
