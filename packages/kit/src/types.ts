import type { ResolvedStarsConfig, StarsHookName, StarsHooks } from '@wolfstar/schema';

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
	/** Adds a package to the auto imports presets (`imports.presets`): all its exports become auto imports. */
	addImports(preset: string | { from: string }): void;
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
	/** Hooks of the `stars` CLI, registered before `setup` runs. An unknown hook name or a value that is not a function is rejected. */
	hooks?: { [Name in StarsHookName]?: StarsHooks[Name] };
	/** Runs in the CLI process, once, while the project loads. */
	setup?(options: Options, ctx: ModuleContext): Awaitable<void>;
}

export type ModuleErrorCode = 'MODULE_LOAD_FAILED' | 'MODULE_INVALID' | 'MODULE_INCOMPATIBLE' | 'MODULE_SETUP_FAILED' | 'MODULE_PLUGIN_INVALID';
