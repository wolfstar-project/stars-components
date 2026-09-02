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
