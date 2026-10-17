import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type {
	ClientHookRegistration,
	LocalesRegistration,
	PiecesDirRegistration,
	ResolvedStarsConfig,
	RuntimePluginRegistration,
	StarsEnvSetupOptions
} from '@wolfstar/schema';

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
	/** The directories of pieces modules added with `ctx.addPiecesDir`, handed to `container.stores.registerPath`. */
	piecesDirs?: readonly PiecesDirRegistration[];
	/** The directories of locales modules added with `ctx.addLocales`, merged into the `i18n` option by a runtime plugin. */
	locales?: readonly LocalesRegistration[];
	/** The runtime hooks modules declared (`hooks['client:*']`, `ctx.addClientHook`): one plugin per module carries them. */
	clientHooks?: readonly ClientHookRegistration[];
	/** Maps a plugin's `from` to what the generated `import` uses. */
	resolve?: (from: string) => string;
}

/**
 * The source of the modules module: every pieces directory is registered with the stores, every runtime plugin is
 * imported from its `from` and handed to `Client.use`, and the runtime hooks of a module go on one plugin named after
 * it. A function export is a factory called with the plugin's options (`definePlugin((options) => ({ … }))`), anything else
 * is the plugin itself (see {@link REGISTER_PLUGIN_SOURCE}).
 */
export function modulesModuleSource(plugins: readonly RuntimePluginRegistration[], options: ModulesModuleSourceOptions = {}): string {
	const {
		framework = '@wolfstar/http-framework',
		piecesDirs = [],
		locales = [],
		clientHooks = [],
		resolve: resolveFrom = (from: string) => from
	} = options;
	const names = ['Client', ...(piecesDirs.length > 0 ? ['container'] : []), ...(locales.length > 0 ? ['getRootData'] : [])];
	const lines = [`import { ${names.join(', ')} } from ${JSON.stringify(framework)};`];
	if (locales.length > 0) lines.push('import { join as __stars_join } from "node:path";');
	for (const [index, plugin] of plugins.entries()) {
		const from = JSON.stringify(resolveFrom(plugin.from));
		const local = `__stars_plugin_${index}`;
		lines.push(
			plugin.export === 'default' ? `import ${local} from ${from};` : `import { ${JSON.stringify(plugin.export)} as ${local} } from ${from};`
		);
	}

	for (const [index, hook] of clientHooks.entries()) {
		const from = JSON.stringify(resolveFrom(hook.from));
		const local = `__stars_hook_${index}`;
		lines.push(
			hook.export === 'default' ? `import ${local} from ${from};` : `import { ${JSON.stringify(hook.export)} as ${local} } from ${from};`
		);
	}

	for (const { path } of piecesDirs) lines.push(`container.stores.registerPath(${JSON.stringify(path)});`);
	lines.push(REGISTER_PLUGIN_SOURCE);
	for (const [index, plugin] of plugins.entries()) {
		lines.push(`__stars_register(__stars_plugin_${index}, ${plugin.options === undefined ? 'undefined' : JSON.stringify(plugin.options)});`);
	}

	if (locales.length > 0) lines.push(localesPluginSource(locales));

	if (clientHooks.length > 0) {
		lines.push('const __stars_hooks = (name, hooks) => Client.use({ name, ...hooks });');
		const byModule = new Map<string, string[]>();
		for (const [index, hook] of clientHooks.entries()) {
			byModule.set(hook.module, [...(byModule.get(hook.module) ?? []), `${JSON.stringify(hook.hook)}: __stars_hook_${index}`]);
		}

		for (const [module, entries] of byModule) lines.push(`__stars_hooks(${JSON.stringify(module)}, { ${entries.join(', ')} });`);
	}

	return `${lines.join('\n')}\n`;
}

/**
 * The runtime plugin that merges the locales modules added into the `i18n` option of the client. It runs `pre`, so it
 * is in place before `@wolfstar/plugin-i18next` builds its handler in its own `preGenericsInitialization`. The plugin
 * only reads its options once, and letting `backend.paths` replace its generated path would drop the project's own
 * languages, so the project's directory (`defaultLanguageDirectory`, else `<root>/languages`) is put back first; the
 * namespaces are added because the plugin only discovers them below that directory.
 */
function localesPluginSource(locales: readonly LocalesRegistration[]): string {
	const data = JSON.stringify(locales.map(({ path, namespaces }) => ({ path, namespaces })));
	return [
		`const __stars_locales = ${data};`,
		'Client.use({ name: "stars:locales", enforce: "pre", preGenericsInitialization(client, options) {',
		'	const i18n = options.i18n;',
		'	if (!i18n) return;',
		'	const pattern = (directory) => __stars_join(directory, "{{lng}}", "{{ns}}.json");',
		'	const consumer = pattern(i18n.defaultLanguageDirectory ?? __stars_join(getRootData().root, "languages"));',
		'	const configured = i18n.i18next;',
		'	options.i18n = { ...i18n,',
		'		backend: { ...i18n.backend, paths: [...new Set([consumer, ...(i18n.backend?.paths ?? []), ...__stars_locales.map((locales) => pattern(locales.path))])] },',
		'		i18next(discovered, languages) {',
		'			const resolved = typeof configured === "function" ? configured(discovered, languages) : configured;',
		'			const own = resolved?.ns === undefined ? [] : [resolved.ns].flat();',
		'			return { ...resolved, ns: [...new Set([...discovered, ...own, ...__stars_locales.flatMap((locales) => locales.namespaces)])] };',
		'		} };',
		'} });'
	].join('\n');
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
	const piecesDirs = config.runtime?.piecesDirs ?? [];
	const clientHooks = config.runtime?.clientHooks ?? [];
	const locales = config.runtime?.locales ?? [];
	const hasModules = runtimePlugins.length > 0 || piecesDirs.length > 0 || locales.length > 0 || clientHooks.length > 0;

	return {
		name: 'stars:plugin-registrations',
		resolveId(id: string) {
			if (env !== null && id === STARS_ENV_MODULE) return STARS_ENV_MODULE;
			return hasModules && id === STARS_MODULES_MODULE ? STARS_MODULES_MODULE : null;
		},
		load(id: string) {
			if (env !== null && id === STARS_ENV_MODULE) return envModuleSource(env);
			return hasModules && id === STARS_MODULES_MODULE ? modulesModuleSource(runtimePlugins, { piecesDirs, locales, clientHooks }) : null;
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
