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

/**
 * A directory of pieces a module registered with `ctx.addPiecesDir`. It holds one folder per store (`commands`,
 * `listeners`, …), like the bot's own `src`, and is handed to `container.stores.registerPath` before the bot loads.
 */
export interface PiecesDirRegistration {
	/** The module that registered it. */
	readonly module: string;
	/** An absolute path. */
	readonly path: string;
}

/** The lifecycle hooks of a runtime plugin, as a module names them in `hooks`: `client:` followed by the plugin hook. */
export const CLIENT_HOOK_NAMES = [
	'client:preGenericsInitialization',
	'client:preInitialization',
	'client:postInitialization',
	'client:preLoad',
	'client:postListen'
] as const;

export type ClientHookName = (typeof CLIENT_HOOK_NAMES)[number];

type WithoutClientPrefix<Name extends string> = Name extends `client:${infer Hook}` ? Hook : never;

/**
 * A runtime hook a module declared (`hooks['client:*']` or `ctx.addClientHook`). Like a plugin it crosses into the
 * bot by source: the entry (or the `node --import` preload) imports the `export` of `from` — a function called with
 * `(client, clientOptions)` — and registers it on a plugin named after the module.
 */
export interface ClientHookRegistration {
	/** The module that registered it. */
	readonly module: string;
	/** The plugin hook it runs at, without the `client:` prefix. */
	readonly hook: WithoutClientPrefix<ClientHookName>;
	/** A package specifier or an absolute file path. */
	readonly from: string;
	/** @default 'default' */
	readonly export: string;
}

/**
 * A directory of locales a module registered with `ctx.addLocales`: `<lng>/<namespace>.json`, the layout
 * `@wolfstar/plugin-i18next` reads. The namespaces are read from the files when the module is set up.
 */
export interface LocalesRegistration {
	/** The module that registered it. */
	readonly module: string;
	/** An absolute path. */
	readonly path: string;
	/** Every namespace found below the language folders, e.g. `commands/shared`. */
	readonly namespaces: readonly string[];
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
	/** Directories of pieces added by `ctx.addPiecesDir`. */
	readonly piecesDirs: readonly PiecesDirRegistration[];
	/** Directories of locales added by `ctx.addLocales`. */
	readonly locales: readonly LocalesRegistration[];
	/** Runtime hooks added by `hooks['client:*']` and `ctx.addClientHook`. */
	readonly clientHooks: readonly ClientHookRegistration[];
	/** Packages added to `imports.presets` by `ctx.addImports`. */
	readonly imports: readonly string[];
	/** The `meta.configKey` of every installed module that declares one: the top-level `stars.config` keys they own. */
	readonly configKeys: readonly string[];
}

export const EMPTY_MODULES_RUNTIME: ModulesRuntime = Object.freeze({
	modules: [],
	plugins: [],
	piecesDirs: [],
	locales: [],
	clientHooks: [],
	imports: [],
	configKeys: []
});
