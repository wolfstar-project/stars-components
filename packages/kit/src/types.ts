import type { ClientHookName, ResolvedStarsConfig, StarsHookName, StarsHooks } from '@wolfstar/schema';

type Awaitable<T> = T | PromiseLike<T>;

/** The options a module declares, merged from its `defaults` and the ones written in `stars.config`. */
export type ModuleOptions = Record<string, any>;

export interface ModuleMeta {
	/** The module's identity, used to install it once, to attribute errors and to report it. Usually the package name. */
	name: string;
	version?: string;
	/**
	 * A top-level `stars.config` key the module owns: what is written under it is merged over `defaults`, and the options
	 * given inline (`[name, options]`, or `ctx.installModule`) over that. It must be a plain object, unique among the
	 * installed modules and not a built-in key (`build`, `dev`, `modules`, …). To type it in `defineConfig`, augment
	 * `StarsConfig`: `declare module '@wolfstar/schema' { interface StarsConfig { scheduledTasks?: Options } }`.
	 */
	configKey?: string;
	/** Version ranges the module works with. A range is only checked when the host knows the version. */
	compatibility?: {
		/** A range for the project's installed `@wolfstar/http-framework`. */
		framework?: string;
		/** A range for the running `@wolfstar/cli`. */
		stars?: string;
	};
}

/** What the host knows about the project: `null` when a version could not be found. */
export interface ModuleVersions {
	framework?: string | null;
	stars?: string | null;
}

/**
 * The hook registry of the host. The CLI hands over its `hookable` instance, so a module's hooks, `stars.config`'s
 * `hooks` and the CLI's own `callHook` calls all share one registry.
 */
export interface ModuleHookHost {
	hook<Name extends StarsHookName>(name: Name, callback: StarsHooks[Name]): unknown;
	callHook<Name extends StarsHookName>(name: Name, ...args: Parameters<StarsHooks[Name]>): Awaitable<unknown>;
}

/**
 * A runtime plugin to register with `Client.use`. It is given by source: the plugin lives in the bot's process, the
 * module's `setup` in the CLI's. The `export` of `from` is the plugin (`definePlugin({ … })`) or, when it is a
 * function, a factory called with `options` (`definePlugin((options) => ({ … }))`). A legacy `Plugin` class is
 * passed to `Client.use` as it is, never called.
 */
export interface ModulePluginSource {
	/**
	 * A package specifier (resolved from the project), an absolute path or a `file:` URL, e.g. `new URL('./plugin.js',
	 * import.meta.url)`. A relative path is rejected: it would resolve differently in each build tool.
	 */
	from: string | URL;
	/** @default 'default' */
	export?: string;
	/** Must be JSON-serialisable: it is written into the built entry. */
	options?: unknown;
}

/**
 * A runtime hook to run at a point of the client's lifecycle, given by source like a {@link ModulePluginSource}: the hook
 * lives in the bot's process, the module's `setup` in the CLI's. The `export` of `from` is a function called with
 * `(client, clientOptions)`, the same arguments a `StarsPlugin` hook gets, and it may return a promise for `client:preLoad`
 * and `client:postListen` only: the other three run inside the synchronous constructor.
 */
export interface ModuleClientHookSource {
	/** A package specifier, an absolute path or a `file:` URL. A relative path is rejected. */
	from: string | URL;
	/** @default 'default' */
	export?: string;
}

/** A module to install: its specifier, or its definition, optionally with options. */
export type ModuleInput<Options extends ModuleOptions = ModuleOptions> = string | StarsModule<Options>;

export interface ModuleContext {
	/** Absolute project root. */
	readonly root: string;
	/** The resolved `stars.config`, before any module contributed. */
	readonly config: ResolvedStarsConfig;
	readonly versions: Readonly<ModuleVersions>;
	/** Registers a runtime plugin. See {@link ModulePluginSource}. */
	addPlugin(plugin: string | URL | ModulePluginSource): void;
	/**
	 * Registers a directory of pieces. It holds one folder per store (`commands`, `listeners`, `interaction-handlers`,
	 * `preconditions`), like the bot's own `src`, and is loaded next to the bot's pieces. Give an absolute path or a
	 * `file:` URL (`new URL('./pieces', import.meta.url)`); a relative path is rejected. The pieces are loaded from files
	 * at runtime, so the directory has to exist in the built bot: a build that bundles everything (Vite, Nitro) has none.
	 */
	addPiecesDir(directory: string | URL): void;
	/**
	 * Registers a directory of locales, `<lng>/<namespace>.json` (nested folders make namespaces such as
	 * `commands/shared`), next to the project's own. Give an absolute path or a `file:` URL; the directory has to exist
	 * when the module is set up, because its namespaces are read then. It is merged into the `i18n` option of the
	 * client by a runtime plugin that runs before `@wolfstar/plugin-i18next` builds its handler, so the project's
	 * languages directory is kept. It needs `@wolfstar/plugin-i18next` and a framework that exports `getRootData`.
	 */
	addLocales(directory: string | URL): void;
	/** Adds a package to the auto imports presets (`imports.presets`): all its exports become auto imports. */
	addImports(preset: string | { from: string }): void;
	/**
	 * Registers a function to run in the bot at `name` (`client:preLoad`, …). It goes on a runtime plugin named after
	 * the module, so a failing hook is reported with the module's name. One hook per name and module.
	 */
	addClientHook(name: ClientHookName, hook: string | URL | ModuleClientHookSource): void;
	/** Registers a hook of the `stars` CLI. */
	hook: ModuleHookHost['hook'];
	/** Calls a hook of the `stars` CLI. */
	callHook: ModuleHookHost['callHook'];
	/** Installs another module, once: a module that is already installed is left as it is, whatever options it got. */
	installModule<Options extends ModuleOptions>(module: ModuleInput<Options>, options?: Partial<Options>): Promise<void>;
}

export interface StarsModule<Options extends ModuleOptions = ModuleOptions> {
	meta: ModuleMeta;
	/** Merged under the options written in `stars.config`. */
	defaults?: Options;
	/** Modules installed before this one. */
	dependencies?: readonly ModuleInput[];
	/**
	 * Hooks of the `stars` CLI (functions), registered before `setup` runs, and runtime hooks (`client:*`, given by
	 * source, see {@link ModuleClientHookSource}), the same as `ctx.addClientHook`. An unknown name or a value of the
	 * wrong kind is rejected.
	 */
	hooks?: { [Name in StarsHookName]?: StarsHooks[Name] } & { [Name in ClientHookName]?: string | URL | ModuleClientHookSource };
	/** Runs in the CLI process, once, while the project loads. */
	setup?(options: Options, ctx: ModuleContext): Awaitable<void>;
}

export type ModuleErrorCode =
	| 'MODULE_LOAD_FAILED'
	| 'MODULE_INVALID'
	| 'MODULE_INCOMPATIBLE'
	| 'MODULE_SETUP_FAILED'
	| 'MODULE_PLUGIN_INVALID'
	| 'MODULE_PIECES_INVALID'
	| 'MODULE_HOOK_INVALID'
	| 'MODULE_LOCALES_INVALID';
