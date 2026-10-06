import { displayPath } from '@wolfstar/schema';
import { defineCommand } from 'citty';
import { createColors } from 'colorette';
import { spawn } from 'node:child_process';
import { projectArgs, resolveCwd, type ProjectArgs } from '../utils/args.js';
import { resolveTypecheckCommand } from '../dev/typechecker.js';
import { cliDiagnostics } from '../utils/diagnostics.js';
import { loadProject } from '../utils/hooks.js';
import { shouldUseColor } from '../utils/output-mode.js';
import { prepareProject, reportWarnings } from './_shared.js';

export interface TypecheckTaskOptions extends ProjectArgs {
	stdout?: NodeJS.WritableStream;
}

/**
 * Type-checks the project once, the way `nuxt typecheck` does: regenerates `.stars/` first, then runs the project's own
 * checker (`dev.typecheck.checker`, `golar` or `tsc`) on every project: the generated app and node configs from
 * compatibility version 6, the single tsconfig below it. A project root `tsconfig.json` that only references them is
 * never passed to `tsc -p`, which would check nothing.
 */
export async function runTypecheck(options: TypecheckTaskOptions): Promise<void> {
	const stdout = options.stdout ?? process.stdout;
	const colors = createColors({ useColor: shouldUseColor() });
	const { config, hooks } = await loadProject({ cwd: resolveCwd(options), configFile: options.config });
	await reportWarnings(config, (text) => process.stderr.write(`${text}\n`), { production: false });
	await prepareProject(config, hooks);

	const { projects } = config.dev.typecheck;
	if (projects.length === 0) throw cliDiagnostics.TYPECHECK_NO_PROJECT({ root: config.root });

	const failed: string[] = [];
	for (const project of projects) {
		const { command, args, node } = resolveTypecheckCommand(config, { project, once: true });
		stdout.write(`${colors.dim('stars')} typecheck ${displayPath(config.root, project)}\n`);
		const code = await new Promise<number | null>((resolve, reject) => {
			const child = spawn(node ? process.execPath : command, node ? [command, ...args] : [...args], {
				cwd: config.root,
				env: process.env,
				stdio: 'inherit',
				windowsHide: true
			});
			child.once('error', reject);
			child.once('exit', resolve);
		});
		if (code !== 0) failed.push(displayPath(config.root, project));
	}

	if (failed.length > 0) throw cliDiagnostics.TYPECHECK_FAILED({ projects: failed.join(', ') });
	stdout.write(`${colors.dim('stars')} ${colors.green('no type errors')}\n`);
}

export default defineCommand({
	meta: {
		name: 'typecheck',
		description: 'Type-check the project, including the generated app and node TypeScript configurations'
	},
	args: { ...projectArgs },
	async run({ args }) {
		await runTypecheck({ config: args.config, cwd: args.cwd });
	}
});
