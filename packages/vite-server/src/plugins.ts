import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { ResolvedStarsConfig, RuntimePluginRegistration, StarsEnvSetupOptions } from '@wolfstar/schema';

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
 * The module that registers the runtime plugins installed modules added with `ctx.addPlugin` (`modules` in
 * `stars.config`). It comes right after {@link STARS_ENV_MODULE} and before the `/register` imports, so a plugin sees
 * the environment and is in place before the legacy registrations.
 */
export const STARS_MODULES_MODULE = '\0stars:modules';

/**
 * How the modules module hands a plugin to `Client.use`: a plugin object, or a legacy `Plugin` class, as it is, and a
 * factory function called with the plugin's options. A `class` is told from a factory by its source, because both are
 * functions and calling a class without `new` throws.
 */
export const REGISTER_PLUGIN_SOURCE =
	'const __stars_register = (plugin, options) => Client.use(typeof plugin === "function" && !/^class[\\s{]/.test(Function.prototype.toString.call(plugin)) ? plugin(options) : plugin);';

export interface ModulesModuleSourceOptions {
	/** Where `Client` is imported from. `resolve` and this let a host that cannot resolve bare specifiers point at files. */
	framework?: string;
	/** Maps a plugin's `from` to what the generated `import` uses. */
	resolve?: (from: string) => string;
}

/**
 * The source of the modules module: every runtime plugin is imported from its `from` and handed to `Client.use`. A
 * function export is a factory called with the plugin's options (`definePlugin((options) => ({ … }))`), anything else
 * is the plugin itself (see {@link REGISTER_PLUGIN_SOURCE}).
 */
export function modulesModuleSource(plugins: readonly RuntimePluginRegistration[], options: ModulesModuleSourceOptions = {}): string {
	const { framework = '@wolfstar/http-framework', resolve: resolveFrom = (from: string) => from } = options;
	const lines = [`import { Client } from ${JSON.stringify(framework)};`];
	for (const [index, plugin] of plugins.entries()) {
		const from = JSON.stringify(resolveFrom(plugin.from));
		const local = `__stars_plugin_${index}`;
		lines.push(
			plugin.export === 'default' ? `import ${local} from ${from};` : `import { ${JSON.stringify(plugin.export)} as ${local} } from ${from};`
		);
	}

	lines.push(REGISTER_PLUGIN_SOURCE);
	for (const [index, plugin] of plugins.entries()) {
		lines.push(`__stars_register(__stars_plugin_${index}, ${plugin.options === undefined ? 'undefined' : JSON.stringify(plugin.options)});`);
	}

	return `${lines.join('\n')}\n`;
}

/**
 * Activates installed WolfStar plugins without making applications maintain a list
 * of side-effect-only plugin registration imports in their entry point, and registers the project's environment
 * ahead of them.
 */
export function pluginRegistrations(config: ResolvedStarsConfig): object {
	// A package that is a module — listed in `modules`, or installed by one that is — was installed because the project
	// says so: it is not also activated by its name, which would register its plugins twice.
	const listed = new Set([
		...(config.modules ?? []).map((module) => module.specifier),
		...(config.runtime?.modules ?? []).map((module) => module.name)
	]);
	const plugins = findPluginDependencies(config.root).filter((name) => !listed.has(name));
	const entry = resolve(config.entry);
	// Optional: hosts and tests may hand over a configuration resolved before `env` existed.
	const env = config.env?.enabled ? config.env.options : null;
	const runtimePlugins = config.runtime?.plugins ?? [];
	const hasModules = runtimePlugins.length > 0;

	return {
		name: 'stars:plugin-registrations',
		resolveId(id: string) {
			if (env !== null && id === STARS_ENV_MODULE) return STARS_ENV_MODULE;
			return hasModules && id === STARS_MODULES_MODULE ? STARS_MODULES_MODULE : null;
		},
		load(id: string) {
			if (env !== null && id === STARS_ENV_MODULE) return envModuleSource(env);
			return hasModules && id === STARS_MODULES_MODULE ? modulesModuleSource(runtimePlugins) : null;
		},
		transform(code: string, id: string) {
			if ((plugins.length === 0 && env === null && !hasModules) || cleanId(id) !== entry) return null;

			const specifiers = [
				...(env === null ? [] : [STARS_ENV_MODULE]),
				...(hasModules ? [STARS_MODULES_MODULE] : []),
				...plugins.map((name) => `${name}/register`)
			];
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
