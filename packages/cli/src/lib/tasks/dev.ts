import { loadStarsConfig, type ResolvedStarsConfig } from '@wolfstar/http-framework/config';
import type { ProjectArgs } from '../args.js';
import { resolveCwd } from '../args.js';
import { assertSupportedExperiments, createBuilder } from '../builders/index.js';
import { DevService } from '../dev-service.js';
import { ExitCode } from '../errors.js';
import { withResolvedLocalhost } from '../host.js';
import { LogFileWriter } from '../log-file.js';
import { prefersReducedMotion, resolveOutputMode, shouldUseColor } from '../output-mode.js';
import { prepareAutoImports } from './prepare.js';

export interface DevTaskOptions extends ProjectArgs {
	tui?: boolean;
}

export async function runDev(options: DevTaskOptions): Promise<void> {
	const config = await resolveDevConfig(await loadStarsConfig({ cwd: resolveCwd(options), configFile: options.config }));
	assertSupportedExperiments(config);
	await prepareAutoImports(config);
	const mode = resolveOutputMode({ tui: options.tui });
	const color = shouldUseColor();

	const service = new DevService(config, { builder: await createBuilder(config) });
	const logFile = config.dev.logFile ? new LogFileWriter(config.dev.logFile, service.logs) : null;
	logFile?.open();
	const renderer =
		mode === 'tui'
			? (await import('../../renderers/tui.js')).createTuiRenderer(service, { color, reducedMotion: prefersReducedMotion() })
			: (await import('../../renderers/plain.js')).createPlainRenderer(service, { color });

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

	process.once('SIGINT', () => void shutdown(ExitCode.Interrupted));
	process.once('SIGTERM', () => void shutdown(ExitCode.Terminated));
	process.once('SIGHUP', () => void shutdown(ExitCode.Terminated));
	if (process.platform !== 'win32') process.on('SIGUSR2', () => void service.restart('manual'));

	const finished = renderer.start().then(() => shutdown(ExitCode.Ok));
	await service.start();
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
