import { displayPath, loadStarsConfig } from '@wolfstar/schema';
import { defineCommand } from 'citty';
import { createColors } from 'colorette';
import { projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { shouldUseColor } from '../utils/output-mode.js';
import { prepareProject } from './_shared.js';

export { prepareProject } from './_shared.js';

export interface PrepareTaskOptions extends ProjectArgs {
	check?: boolean;
	json?: boolean;
	stdout?: NodeJS.WritableStream;
}

/**
 * Generates `.stars/tsconfig.json` and `imports.dts` (see {@link StarsImportsConfig} in `@wolfstar/schema`), the way `nuxt
 * prepare` regenerates `.nuxt/imports.d.ts`. Run automatically by `stars dev` and `stars build` before the first
 * build; `--check` fails instead of writing, for CI.
 */
export async function runPrepare(options: PrepareTaskOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() && !options.json });
	const config = await loadStarsConfig({ cwd: resolveCwd(options), configFile: options.config });
	const result = await prepareProject(config, Boolean(options.check));

	if (options.json) {
		stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} else {
		const paintConfig = result.tsconfig.status === 'outdated' ? colors.red : colors.green;
		stdout.write(`${colors.dim('stars')} tsconfig: ${paintConfig(result.tsconfig.status)} ${displayPath(config.root, result.tsconfig.path)}\n`);
		if (result.enabled) {
			const paint = result.status === 'outdated' ? colors.red : colors.green;
			stdout.write(`${colors.dim('stars')} imports: ${paint(result.status)} ${displayPath(config.root, result.dts)}\n`);
		}
	}

	if (result.status === 'outdated' || result.tsconfig.status === 'outdated') {
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
