import { displayPath } from '@wolfstar/schema';
import { defineCommand } from 'citty';
import { createColors } from 'colorette';
import { projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { shouldUseColor } from '../utils/output-mode.js';
import { loadProject } from '../utils/hooks.js';
import { prepareProject, reportWarnings } from './_shared.js';

export { prepareProject } from './_shared.js';

export interface PrepareTaskOptions extends ProjectArgs {
	check?: boolean;
	json?: boolean;
	stdout?: NodeJS.WritableStream;
}

/**
 * Generates `.stars/tsconfig.app.json` and `.stars/tsconfig.node.json` (a single `.stars/tsconfig.json` below
 * compatibility version 6) and `imports.dts` (see {@link StarsImportsConfig} in `@wolfstar/schema`), the way `nuxt
 * prepare` regenerates `.nuxt/imports.d.ts`. Run automatically by `stars dev` and `stars build` before the first
 * build; `--check` fails instead of writing, for CI.
 */
export async function runPrepare(options: PrepareTaskOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() && !options.json });
	const { config, hooks } = await loadProject({ cwd: resolveCwd(options), configFile: options.config });
	await reportWarnings(config, (text) => process.stderr.write(`${text}\n`));
	const result = await prepareProject(config, hooks, Boolean(options.check));

	if (options.json) {
		stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} else {
		for (const file of result.tsconfigs) {
			const paintConfig = file.status === 'outdated' ? colors.red : colors.green;
			const label = file.name === 'tsconfig' ? 'tsconfig' : `tsconfig ${file.name}`;
			stdout.write(`${colors.dim('stars')} ${label}: ${paintConfig(file.status)} ${displayPath(config.root, file.path)}\n`);
		}
		if (result.modules) {
			const paint = result.modules.status === 'outdated' ? colors.red : colors.green;
			stdout.write(`${colors.dim('stars')} modules: ${paint(result.modules.status)} ${displayPath(config.root, result.modules.path)}\n`);
		}
		if (result.enabled) {
			const paint = result.status === 'outdated' ? colors.red : colors.green;
			stdout.write(`${colors.dim('stars')} imports: ${paint(result.status)} ${displayPath(config.root, result.dts)}\n`);
		}
	}

	if (result.status === 'outdated' || result.tsconfigs.some((file) => file.status === 'outdated') || result.modules?.status === 'outdated') {
		throw cliDiagnostics.PREPARE_OUTDATED({});
	}
}

export default defineCommand({
	meta: {
		name: 'prepare',
		description: 'Generate TypeScript configuration and auto imports declarations'
	},
	args: {
		...projectArgs,
		check: {
			type: 'boolean',
			description: 'Fail when the generated files are out of date instead of writing it',
			default: false
		},
		json: {
			type: 'boolean',
			description: 'Print machine-readable JSON',
			default: false
		}
	},
	async run({ args }) {
		await runPrepare({ config: args.config, cwd: args.cwd, check: args.check, json: args.json });
	}
});
