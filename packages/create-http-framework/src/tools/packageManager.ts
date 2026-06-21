import { execFileSync } from 'node:child_process';
import type { AgentName } from 'package-manager-detector';
import { resolveCommand } from 'package-manager-detector/commands';
import { detect } from 'package-manager-detector/detect';

export type PackageManager = AgentName;

export async function detectPackageManager(installIn?: string): Promise<PackageManager> {
	const detected = await detect({ cwd: process.cwd() });
	const agent = detected?.agent ?? 'npm';
	const name = detected?.name ?? 'npm';

	if (installIn) {
		const resolved = resolveCommand(agent, 'install', []);
		if (!resolved) {
			throw new Error(`Could not resolve install command for ${agent}`);
		}

		execFileSync(resolved.command, resolved.args, {
			cwd: installIn,
			stdio: process.env['DEBUG'] ? 'inherit' : 'pipe'
		});
	}

	return name;
}
