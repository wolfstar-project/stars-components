/**
 * A module as listed in `modules` in `stars.config`: a package name (or a file path Node can import) on its own, or
 * a `[specifier, options]` tuple whose options are merged over the module's `defaults`. Falsy entries are dropped, so
 * `modules: [useCache && '@wolfstar/plugin-cache']` works.
 */
export type StarsModuleEntry = string | readonly [specifier: string, options?: Record<string, unknown>];

/** One entry of `modules`, normalised. */
export interface ResolvedModuleEntry {
	/** A package name, or a file path/URL, the module is imported from. */
	readonly specifier: string;
	/** The options written in `stars.config`, before the module's `defaults` are merged under them. */
	readonly options: Readonly<Record<string, unknown>>;
}

/**
 * A runtime plugin a module registered with `ctx.addPlugin`. Plugins cross from the CLI process into the bot by
 * source, not by value: the entry (or, for the `tsc`/`none` build tools, a `node --import` preload) imports `from` and
 * passes its `export` to `Client.use` — as the plugin itself, or, when it is a function, the result of calling it with
 * `options`.
 */
export interface RuntimePluginRegistration {
	/** The module that registered it. */
	readonly module: string;
	/** A package specifier or an absolute file path. */
	readonly from: string;
	/** @default 'default' */
	readonly export: string;
	/** JSON-serialisable options handed to the plugin when it is a factory. */
	readonly options?: unknown;
}

/** A module that was installed. */
export interface InstalledModule {
	readonly name: string;
	readonly version?: string;
}

/** What the installed modules contributed, known once the CLI ran their `setup`. Empty until then. */
export interface ModulesRuntime {
	readonly modules: readonly InstalledModule[];
	readonly plugins: readonly RuntimePluginRegistration[];
	/** Packages added to `imports.presets` by `ctx.addImports`. */
	readonly imports: readonly string[];
	/** The `meta.configKey` of every installed module that declares one: the top-level `stars.config` keys they own. */
	readonly configKeys: readonly string[];
}

export const EMPTY_MODULES_RUNTIME: ModulesRuntime = Object.freeze({ modules: [], plugins: [], imports: [], configKeys: [] });
