import spawn from 'cross-spawn';
import type { AgentName } from 'package-manager-detector';
import { resolveCommand } from 'package-manager-detector/commands';
import { detect } from 'package-manager-detector/detect';

export type PackageManager = AgentName;

export async function detectPackageManager(): Promise<PackageManager> {
	const detected = await detect({ cwd: process.cwd() });
	if (detected?.name) return detected.name;

	const userAgent = process.env['npm_config_user_agent'];
	if (userAgent) {
		const name = userAgent.split('/')[0] as PackageManager;
		if (['npm', 'yarn', 'pnpm', 'bun', 'deno'].includes(name)) return name;
	}

	return 'npm';
}

function quoteToken(token: string): string {
	return /\s/.test(token) ? `"${token}"` : token;
}

/**
 * Builds the correct "run a script" command string for the given package manager, e.g.
 * `npm run build` / `pnpm run build`. Extra args are forwarded the way each manager expects
 * (npm inserts the `--` separator automatically), and tokens containing spaces are quoted so
 * nested commands (`--onSuccess "pnpm run start"`) survive being placed in a package.json script.
 */
export function getRunScript(pm: PackageManager, script: string, args: string[] = []): string {
	const resolved = resolveCommand(pm, 'run', [script, ...args]);
	if (!resolved) throw new Error(`Could not resolve run command for ${pm}`);
	return [resolved.command, ...resolved.args].map(quoteToken).join(' ');
}

/** Returns the install command string for the given package manager, e.g. `pnpm install`. */
export function getInstallScript(pm: PackageManager): string {
	const resolved = resolveCommand(pm, 'install', []);
	if (!resolved) throw new Error(`Could not resolve install command for ${pm}`);
	return [resolved.command, ...resolved.args].map(quoteToken).join(' ');
}

export async function installDependencies(pm: PackageManager, dir: string): Promise<void> {
	const detected = await detect({ cwd: process.cwd() });
	const agent = detected?.agent ?? pm;
	const resolved = resolveCommand(agent, 'install', []);
	if (!resolved) throw new Error(`Could not resolve install command for ${agent}`);

	const result = spawn.sync(resolved.command, resolved.args, {
		cwd: dir,
		stdio: process.env['DEBUG'] ? 'inherit' : 'pipe'
	});

	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`Dependency installation failed with exit code ${result.status ?? 'unknown'}`);
}

/** Runs an arbitrary command in `dir` via cross-spawn (used for the post-scaffold formatter pass). */
export function runCommand(command: string, args: string[], dir: string): void {
	const result = spawn.sync(command, args, {
		cwd: dir,
		stdio: process.env['DEBUG'] ? 'inherit' : 'pipe'
	});

	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`Command "${command}" failed with exit code ${result.status ?? 'unknown'}`);
}
