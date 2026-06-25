import { execFileSync } from 'node:child_process';
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

export async function installDependencies(pm: PackageManager, dir: string): Promise<void> {
	const detected = await detect({ cwd: process.cwd() });
	const agent = detected?.agent ?? pm;
	const resolved = resolveCommand(agent, 'install', []);
	if (!resolved) throw new Error(`Could not resolve install command for ${agent}`);
	execFileSync(resolved.command, resolved.args, {
		cwd: dir,
		stdio: process.env['DEBUG'] ? 'inherit' : 'pipe'
	});
}
