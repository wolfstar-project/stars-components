import { displayPath, loadStarsConfig } from '@wolfstar/schema';
import { defineCommand } from 'citty';
import { createColors } from 'colorette';
import { createBuilder } from '../builders/index.js';
import { projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { Locales } from '../utils/locales.js';
import { shouldUseColor } from '../utils/output-mode.js';
import { prepareProject } from './_shared.js';

export interface BuildTaskOptions extends ProjectArgs {
	stdout?: NodeJS.WritableStream;
}

export async function runBuild(options: BuildTaskOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() });
	const config = await loadStarsConfig({ cwd: resolveCwd(options), configFile: options.config });
	await prepareProject(config);

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
		throw cliDiagnostics.BUILD_FAILED({ message: outcome.message ?? '' });
	}
	new Locales(config).copy();

	stdout.write(`${colors.dim('stars')} ${colors.green(`built in ${outcome.durationMs}ms`)} → ${displayPath(config.root, config.build.output)}\n`);
}

export default defineCommand({
	meta: {
		name: 'build',
		description: 'Build the project once with the configured build tool'
	},
	args: { ...projectArgs },
	async run({ args }) {
		await runBuild({ config: args.config, cwd: args.cwd });
	}
});
