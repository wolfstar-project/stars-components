import { execSync } from 'node:child_process';

export type PackageManager = 'bun' | 'npm' | 'pnpm' | 'yarn';

export function detectPackageManager(): PackageManager {
	if (process.versions.bun) {
		return 'bun';
	}

	const userAgent = process.env['npm_config_user_agent'];
	if (userAgent) {
		if (userAgent.startsWith('yarn')) return 'yarn';
		if (userAgent.startsWith('pnpm')) return 'pnpm';
		if (userAgent.startsWith('bun')) return 'bun';
	}

	return 'npm';
}

export function installDependencies(directory: string, packageManager: PackageManager): void {
	execSync(`${packageManager} install`, {
		cwd: directory,
		stdio: process.env['DEBUG'] ? 'inherit' : 'pipe'
	});
}
