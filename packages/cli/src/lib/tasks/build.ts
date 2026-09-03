import { createColors } from 'colorette';
import type { ProjectArgs } from '../args.js';
import { resolveCwd } from '../args.js';
import { assertSupportedExperiments, createBuilder } from '../builders/index.js';
import { loadStarsConfig } from '@wolfstar/http-framework/config';
import { displayPath } from '@wolfstar/http-framework/config';
import { CliError, ExitCode } from '../errors.js';
import { shouldUseColor } from '../output-mode.js';
import { prepareAutoImports } from './prepare.js';

export interface BuildTaskOptions extends ProjectArgs {
	stdout?: NodeJS.WritableStream;
}

export async function runBuild(options: BuildTaskOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() });
	const config = await loadStarsConfig({ cwd: resolveCwd(options), configFile: options.config });
	assertSupportedExperiments(config);
	await prepareAutoImports(config);

	if (config.build.tool === 'none') {
		stdout.write(`${colors.dim('stars')} nothing to build, ${displayPath(config.root, config.entry)} runs as-is (build.tool is 'none')\n`);
		return;
	}

	const builder = await createBuilder(config);
	builder.on('log', (level, text) => {
		const paint = level === 'error' ? colors.red : level === 'warn' ? colors.yellow : (value: string) => value;
		stdout.write(`${paint(text)}\n`);
	});

	stdout.write(`${colors.dim('stars')} building with ${colors.bold(config.build.tool)}…\n`);
	const outcome = await builder.build();
	if (!outcome.ok) {
		throw new CliError(`Build failed${outcome.message ? `: ${outcome.message}` : ''}`, { code: 'BUILD_FAILED', exitCode: ExitCode.BuildFailed });
	}

	stdout.write(`${colors.dim('stars')} ${colors.green(`built in ${outcome.durationMs}ms`)} → ${displayPath(config.root, config.build.output)}\n`);
}
