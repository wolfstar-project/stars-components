import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { ResolvedStarsConfig, StarsEnvSetupOptions } from '@wolfstar/schema';

interface PackageJson {
	dependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	exports?: unknown;
}

const PLUGIN_PACKAGE = /^@wolfstar\/plugin-[^/]+$/;

/**
 * The module that loads the project's environment (`env` in `stars.config`). It is virtual so its import can come
 * first in the entry: ES modules evaluate their imports in order, and every `@wolfstar/plugin-*` registration (and the
 * bot's own modules) may read `process.env` as soon as it is evaluated.
 */
export const STARS_ENV_MODULE = '\0stars:env';

/**
 * The source of the env module: `setup()` from `@wolfstar/env-utilities` called with the resolved options.
 * `specifier` lets a host that cannot resolve bare specifiers (a `data:` URL preload) point at the file itself.
 */
export function envModuleSource(options: Readonly<StarsEnvSetupOptions>, specifier = '@wolfstar/env-utilities'): string {
	return `import { setup } from ${JSON.stringify(specifier)};\nsetup(${JSON.stringify(options)});\n`;
}

/**
 * Activates installed WolfStar plugins without making applications maintain a list
 * of side-effect-only plugin registration imports in their entry point, and registers the project's environment
 * ahead of them.
 */
export function pluginRegistrations(config: ResolvedStarsConfig): object {
	const plugins = findPluginDependencies(config.root);
	const entry = resolve(config.entry);
	// Optional: hosts and tests may hand over a configuration resolved before `env` existed.
	const env = config.env?.enabled ? config.env.options : null;

	return {
		name: 'stars:plugin-registrations',
		resolveId(id: string) {
			return env !== null && id === STARS_ENV_MODULE ? STARS_ENV_MODULE : null;
		},
		load(id: string) {
			return env !== null && id === STARS_ENV_MODULE ? envModuleSource(env) : null;
		},
		transform(code: string, id: string) {
			if ((plugins.length === 0 && env === null) || cleanId(id) !== entry) return null;

			const specifiers = [...(env === null ? [] : [STARS_ENV_MODULE]), ...plugins.map((name) => `${name}/register`)];
			return { code: `${specifiers.map((specifier) => `import ${JSON.stringify(specifier)};`).join('\n')}\n${code}`, map: null };
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
