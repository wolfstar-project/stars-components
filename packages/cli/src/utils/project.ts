import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CliError } from './errors.js';

/**
 * Resolves a module id from the project root, the way the project itself would.
 */
export function resolveFromProject(root: string, id: string): string | null {
	try {
		return createRequire(join(root, 'package.json')).resolve(id);
	} catch {
		return null;
	}
}

/**
 * Imports a module from the project root, failing with an actionable error when it is not installed.
 */
export async function importFromProject<T>(root: string, id: string, hint: string): Promise<T> {
	const resolved = resolveFromProject(root, id);
	if (!resolved) {
		throw new CliError(`"${id}" is not installed in ${root}`, { code: 'DEPENDENCY_MISSING', hint });
	}

	return (await import(pathToFileURL(resolved).href)) as T;
}

/**
 * Resolves an executable a package declares in its `package.json#bin`, from the project's own `node_modules`.
 *
 * Going through `bin` rather than a hardcoded path is what makes this work across layouts: TypeScript 7 hides
 * `lib/tsc.js` behind its `exports` map, and packages move their entry points between releases.
 */
export function resolveBinary(root: string, packageName: string, binName: string): string | null {
	const packageJsonPath = resolveFromProject(root, `${packageName}/package.json`);
	if (!packageJsonPath) return null;

	try {
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { bin?: string | Record<string, string> };
		const bin = typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin?.[binName];
		return bin ? join(dirname(packageJsonPath), bin) : null;
	} catch {
		return null;
	}
}

/**
 * Finds the version of an installed package by walking `node_modules` up from `root`.
 */
export function findInstalledVersion(root: string, name: string): string | null {
	let directory = root;
	for (;;) {
		const file = join(directory, 'node_modules', name, 'package.json');
		if (existsSync(file)) {
			try {
				const parsed = JSON.parse(readFileSync(file, 'utf-8')) as { version?: string };
				return parsed.version ?? null;
			} catch {
				return null;
			}
		}

		const parent = dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
}
