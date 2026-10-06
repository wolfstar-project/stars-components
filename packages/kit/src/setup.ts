import {
	BUILT_IN_CONFIG_KEYS,
	STARS_HOOK_NAMES,
	type InstalledModule,
	type ModulesRuntime,
	type ResolvedStarsConfig,
	type RuntimePluginRegistration
} from '@wolfstar/schema';
import { satisfies } from 'semver';
import { fileURLToPath } from 'node:url';
import { ModuleError } from './errors.js';
import { isPlainObject, mergeOptions } from './options.js';
import type { ModuleContext, ModuleHookHost, ModuleInput, ModuleOptions, ModulePluginSource, ModuleVersions, StarsModule } from './types.js';

export interface SetupModulesOptions {
	/** The resolved configuration: `root` and `modules` are read from it. */
	config: ResolvedStarsConfig;
	hooks: ModuleHookHost;
	/** Imports a module specifier from the project. Its default export (or the namespace itself) is the module. */
	load(specifier: string): Promise<unknown>;
	versions?: ModuleVersions;
}

/**
 * Installs the modules listed in `config.modules`, in order and each dependency first, and returns what they
 * contributed. A module that is already installed (by `meta.name`) is skipped.
 *
 * The options a module's `setup` receives are its `defaults`, then the `stars.config` key named by its
 * `meta.configKey` (`config.moduleOptions`), then the options given inline (the `[specifier, options]` tuple, or the
 * ones passed to `ctx.installModule`), each merged over the previous with {@link mergeOptions}.
 */
export async function setupModules(options: SetupModulesOptions): Promise<ModulesRuntime> {
	const { config, hooks, load, versions = {} } = options;
	const installed = new Set<string>();
	const modules: InstalledModule[] = [];
	const plugins: RuntimePluginRegistration[] = [];
	const imports = new Set<string>();
	/** `meta.configKey` -> the module that claimed it. */
	const configKeys = new Map<string, string>();

	async function resolveModule(input: ModuleInput): Promise<StarsModule> {
		if (typeof input !== 'string') return validate(input, input.meta?.name ?? '(inline)');

		let loaded: unknown;
		try {
			loaded = await load(input);
		} catch (error) {
			throw new ModuleError('MODULE_LOAD_FAILED', input, `The module "${input}" could not be loaded: ${message(error)}`, error);
		}

		const exported = (loaded as { default?: unknown } | null)?.default ?? loaded;
		// A CommonJS package imported from ESM nests its `exports.default` under `default`.
		const unwrapped = (exported as { default?: unknown } | null)?.default ?? exported;
		return validate(unwrapped, input);
	}

	async function install(input: ModuleInput, userOptions: Record<string, unknown> | undefined): Promise<void> {
		const module = await resolveModule(input);
		const { name } = module.meta;
		if (installed.has(name)) return;
		installed.add(name);

		checkCompatibility(module, versions);
		const configOptions = claimConfigKey(module, configKeys, config.moduleOptions);
		for (const dependency of module.dependencies ?? []) await install(dependency, undefined);

		for (const [hook, callback] of Object.entries(module.hooks ?? {})) {
			if (!KNOWN_HOOKS.has(hook) || typeof callback !== 'function') {
				throw new ModuleError(
					'MODULE_INVALID',
					name,
					KNOWN_HOOKS.has(hook)
						? `The hook "${hook}" of the module "${name}" must be a function.`
						: `The module "${name}" declares an unknown hook "${hook}". Known hooks: ${STARS_HOOK_NAMES.join(', ')}.`
				);
			}

			hooks.hook(hook as never, callback as never);
		}

		const installedModule: InstalledModule = module.meta.version === undefined ? { name } : { name, version: module.meta.version };
		const context: ModuleContext = {
			root: config.root,
			config,
			versions,
			addPlugin: (plugin) => plugins.push(toRegistration(name, plugin)),
			addImports: (preset) => void imports.add(typeof preset === 'string' ? preset : preset.from),
			hook: (hookName, callback) => hooks.hook(hookName, callback),
			callHook: (hookName, ...args) => hooks.callHook(hookName, ...args),
			installModule: (nested, nestedOptions) => install(nested as ModuleInput, nestedOptions)
		};

		try {
			await module.setup?.(mergeOptions<ModuleOptions>(mergeOptions<ModuleOptions>(module.defaults, configOptions), userOptions), context);
		} catch (error) {
			if (error instanceof ModuleError) throw error;
			throw new ModuleError('MODULE_SETUP_FAILED', name, `The module "${name}" failed during setup: ${message(error)}`, error);
		}

		modules.push(installedModule);
	}

	for (const entry of config.modules) await install(entry.specifier, entry.options as Record<string, unknown>);

	return { modules, plugins, imports: [...imports], configKeys: [...configKeys.keys()] };
}

const KNOWN_HOOKS: ReadonlySet<string> = new Set(STARS_HOOK_NAMES);

function validate(value: unknown, label: string): StarsModule {
	const module = value as Partial<StarsModule> | null;
	if (module === null || typeof module !== 'object' || typeof module.meta?.name !== 'string' || module.meta.name === '') {
		throw new ModuleError(
			'MODULE_INVALID',
			label,
			`"${label}" is not a Stars module: its default export must be created with \`defineModule\` and have a \`meta.name\`.`
		);
	}

	if (module.setup !== undefined && typeof module.setup !== 'function') {
		throw new ModuleError('MODULE_INVALID', module.meta.name, `The \`setup\` of the module "${module.meta.name}" must be a function.`);
	}

	const { configKey } = module.meta;
	if (configKey !== undefined && (typeof configKey !== 'string' || configKey === '')) {
		throw new ModuleError(
			'MODULE_INVALID',
			module.meta.name,
			`The \`meta.configKey\` of the module "${module.meta.name}" must be a non-empty string.`
		);
	}

	return module as StarsModule;
}

const BUILT_IN_KEYS: ReadonlySet<string> = new Set(BUILT_IN_CONFIG_KEYS);

/**
 * Records that `module` owns its `meta.configKey` and returns what `stars.config` holds under it (`undefined` when it
 * declares no key or the config has no value for it).
 */
function claimConfigKey(
	module: StarsModule,
	claimed: Map<string, string>,
	moduleOptions: Readonly<Record<string, unknown>>
): Record<string, unknown> | undefined {
	const { name, configKey } = module.meta;
	if (configKey === undefined) return undefined;

	if (BUILT_IN_KEYS.has(configKey)) {
		throw new ModuleError(
			'MODULE_INVALID',
			name,
			`The module "${name}" declares the \`configKey\` "${configKey}", which is a built-in key of stars.config. Pick another one.`
		);
	}

	const owner = claimed.get(configKey);
	if (owner !== undefined) {
		throw new ModuleError(
			'MODULE_INVALID',
			name,
			`The modules "${owner}" and "${name}" both declare the \`configKey\` "${configKey}". A key can belong to one module only.`
		);
	}

	claimed.set(configKey, name);

	const value = moduleOptions[configKey];
	if (value === undefined) return undefined;
	if (!isPlainObject(value)) {
		throw new ModuleError(
			'MODULE_INVALID',
			name,
			`\`${configKey}\` in stars.config holds the options of the module "${name}" and must be an object, got ${describeValue(value)}.`
		);
	}

	return value;
}

function describeValue(value: unknown): string {
	if (value === null) return 'null';
	return Array.isArray(value) ? 'an array' : `a ${typeof value}`;
}

function checkCompatibility(module: StarsModule, versions: ModuleVersions): void {
	const { name, compatibility } = module.meta;
	for (const [key, label] of [
		['framework', '@wolfstar/http-framework'],
		['stars', '@wolfstar/cli']
	] as const) {
		const range = compatibility?.[key];
		const version = versions[key];
		if (range === undefined || version === undefined || version === null) continue;
		if (!satisfies(version, range, { includePrerelease: true })) {
			throw new ModuleError('MODULE_INCOMPATIBLE', name, `The module "${name}" needs ${label} ${range}, but ${version} is installed.`);
		}
	}
}

const RELATIVE_PATH = /^\.\.?(?:[/\\]|$)/;

function toRegistration(moduleName: string, plugin: string | URL | ModulePluginSource): RuntimePluginRegistration {
	const source: ModulePluginSource = typeof plugin === 'string' || plugin instanceof URL ? { from: plugin } : plugin;
	const from = typeof source.from === 'string' ? source.from : source.from?.href;
	if (typeof from !== 'string' || from === '') {
		throw new ModuleError('MODULE_PLUGIN_INVALID', moduleName, `A plugin added by "${moduleName}" needs a \`from\` specifier, path or URL.`);
	}

	if (RELATIVE_PATH.test(from)) {
		throw new ModuleError(
			'MODULE_PLUGIN_INVALID',
			moduleName,
			`The plugin "${from}" added by "${moduleName}" is a relative path, which would resolve differently per build tool. Use a package specifier, an absolute path or a \`file:\` URL, e.g. \`new URL('./plugin.js', import.meta.url)\`.`
		);
	}

	if (source.options !== undefined && !isJsonSerialisable(source.options)) {
		throw new ModuleError(
			'MODULE_PLUGIN_INVALID',
			moduleName,
			`The options of a plugin added by "${moduleName}" must be JSON-serialisable: they are written into the built entry.`
		);
	}

	const registration = { module: moduleName, from: from.startsWith('file:') ? fileURLToPath(from) : from, export: source.export ?? 'default' };
	return source.options === undefined ? registration : { ...registration, options: source.options };
}

function isJsonSerialisable(value: unknown): boolean {
	try {
		return (
			JSON.stringify(value, (_key, item: unknown) => {
				if (typeof item === 'function' || typeof item === 'symbol' || typeof item === 'bigint') throw new TypeError('not serialisable');
				return item;
			}) !== undefined
		);
	} catch {
		return false;
	}
}

function message(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
