import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { ResolvedStarsConfig } from '@wolfstar/schema';

interface PackageJson {
	dependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	exports?: unknown;
}

const PLUGIN_PACKAGE = /^@wolfstar\/plugin-[^/]+$/;

/**
 * Activates installed WolfStar plugins without making applications maintain a list
 * of side-effect-only plugin registration imports in their entry point.
 */
export function pluginRegistrations(config: ResolvedStarsConfig): object {
	const plugins = findPluginDependencies(config.root);
	const entry = resolve(config.entry);

	return {
		name: 'stars:plugin-registrations',
		transform(code: string, id: string) {
			if (plugins.length === 0 || cleanId(id) !== entry) return null;

			const registrations = plugins.map((name) => `import ${JSON.stringify(`${name}/register`)};`).join('\n');
			return { code: `${registrations}\n${code}`, map: null };
		}
	};
}

function findPluginDependencies(root: string): string[] {
	const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as PackageJson;
	return [...new Set([...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.optionalDependencies ?? {})])]
		.filter((name) => PLUGIN_PACKAGE.test(name) && mayExportRegister(root, name))
		.sort();
}

/**
 * Not every `@wolfstar/plugin-*` package is activated through a `/register` entrypoint: some (`plugin-cache`,
 * `plugin-gateway`, `plugin-sharder`) are libraries used directly, and injecting an import of a subpath they do not
 * export breaks the build. Only a package whose `exports` map is known and has no `./register` subpath is skipped —
 * one that is not installed, or declares no `exports`, keeps being injected so a missing install still surfaces as a
 * resolution error.
 */
function mayExportRegister(root: string, name: string): boolean {
	const packageJson = readInstalledPackageJson(root, name);
	if (packageJson?.exports === undefined || packageJson.exports === null) return true;
	return exportsSubpath(packageJson.exports, './register');
}

function readInstalledPackageJson(root: string, name: string): PackageJson | null {
	let directory = resolve(root);
	while (true) {
		try {
			return JSON.parse(readFileSync(join(directory, 'node_modules', name, 'package.json'), 'utf8')) as PackageJson;
		} catch {
			const parent = dirname(directory);
			if (parent === directory) return null;
			directory = parent;
		}
	}
}

function exportsSubpath(exports: unknown, subpath: string): boolean {
	// A string, an array, or an object of conditions only is the sugar for the `"."` subpath alone.
	if (typeof exports !== 'object' || exports === null || Array.isArray(exports)) return false;

	const keys = Object.keys(exports);
	if (!keys.some((key) => key.startsWith('.'))) return false;
	if (Object.hasOwn(exports, subpath)) return (exports as Record<string, unknown>)[subpath] !== null;

	return keys.some((key) => {
		const star = key.indexOf('*');
		if (star === -1) return false;
		const prefix = key.slice(0, star);
		const suffix = key.slice(star + 1);
		return subpath.length >= key.length && subpath.startsWith(prefix) && subpath.endsWith(suffix);
	});
}

function cleanId(id: string): string {
	return resolve(id.replace(/^\0/, '').split('?', 1)[0]!);
}
