import type { StarsHooksConfig } from './hooks.js';
import type { StarsModuleEntry } from './modules.js';

/**
 * The build tool used to turn the project sources into runnable JavaScript.
 *
 * - `tsdown`: run the project's own `tsdown` programmatically, configured from {@link StarsConfig.tsdown} (and, with
 *   {@link StarsFutureConfig.compatibilityVersion} `3`, from the project's `tsdown.config.*` too).
 * - `tsc`: run the project's `tsc -b` on the configured `tsconfig`.
 * - `vite`: run the project's own `vite` (configuration file included), requires `experimental.enableVite`.
 * - `none`: the entry is runnable as-is (JavaScript projects), no build step.
 * - `auto`: detect from the project (default).
 */
export type StarsBuildTool = 'tsdown' | 'tsc' | 'none' | 'vite';

export interface StarsBuildConfig {
	/**
	 * The build tool to use.
	 * @default 'auto'
	 */
	tool?: StarsBuildTool | 'auto';
	/**
	 * The directory, relative to {@link StarsConfig.root}, the build writes into.
	 * @default 'dist', or '.output' when `experimental.enableNitro` is on (Nitro's own convention)
	 */
	outDir?: string;
	/**
	 * The `tsconfig.json` the `tsc` and `tsdown` build tools use, relative to {@link StarsConfig.root}.
	 * @default 'src/tsconfig.json' when it exists, 'tsconfig.json' otherwise
	 */
	tsconfig?: string;
}

/**
 * Raw options merged into the project's own `vite.config.*`, the way `vite: {}` in a Nuxt config is merged into
 * Nuxt's own Vite config. Kept as `unknown` here (the CLI, not the framework, depends on `vite`'s types) and passed
 * to Vite's `mergeConfig` as-is.
 */
export type StarsViteConfig = Record<string, unknown>;

/**
 * Options for `tsdown`, the bundler `stars build` uses by default.
 *
 * From {@link StarsFutureConfig.compatibilityVersion} `4` on these replace `tsdown.config.*` outright: the build is
 * derived from `stars.config` (the entry's directory, `build.outDir`, `build.tsconfig`) and these options are layered
 * on top, so a project keeps one configuration file instead of two. With `3` the project's own `tsdown.config.*` is
 * still loaded and these are merged over it, the way `vite: {}` in a Nuxt config is merged into the project's own
 * Vite config: values here win, and `plugins` are appended rather than replaced.
 *
 * The options named below are the ones a bot usually reaches for. Every other `tsdown` option is accepted as-is —
 * the framework does not depend on `tsdown`, so they stay loosely typed here and `tsdown`'s own `UserConfig` is the
 * reference.
 */
export interface StarsTsdownConfig {
	/** Entry files or glob patterns, relative to the project root. Defaults to every source file next to `entry`. */
	entry?: string | readonly string[] | Record<string, string>;
	/** @default 'esm' */
	format?: 'esm' | 'cjs' | 'iife' | 'umd' | readonly string[] | Record<string, unknown>;
	/** @default 'node' */
	platform?: 'node' | 'neutral' | 'browser';
	target?: string | readonly string[] | false;
	/**
	 * Emits one output file per source file instead of a single bundle, so pieces stay loadable from `dist/commands`
	 * and friends at runtime.
	 * @default true
	 */
	unbundle?: boolean;
	/** Rolldown plugins. Appended to the ones `stars` adds (auto imports) and to those of a `tsdown.config.*`. */
	plugins?: readonly unknown[];
	alias?: Record<string, string>;
	define?: Record<string, string>;
	external?: unknown;
	noExternal?: unknown;
	deps?: Record<string, unknown>;
	/** @default () => ({ js: extname(build.output) }) */
	outExtensions?: unknown;
	/** @default true */
	sourcemap?: boolean | 'inline' | 'hidden';
	minify?: unknown;
	/** @default false — a bot is not a library, so no declaration files are emitted. */
	dts?: boolean | Record<string, unknown>;
	/** @default true */
	clean?: boolean | readonly string[];
	treeshake?: boolean;
	copy?: unknown;
	hooks?: Record<string, unknown>;
	[option: string]: unknown;
}

/**
 * The build-default generation the project runs on. Version 5 is current and version 4 remains supported.
 * Version 3 is end-of-life: it still resolves, with a warning, and is removed in the next major.
 */
export type StarsCompatibilityVersion = 3 | 4 | 5;

/**
 * Nuxt-style compatibility block. New projects need not set it; version 4 stays available, and version 3 is kept only
 * as an end-of-life migration escape hatch for projects that still use a standalone `tsdown.config.*`.
 */
export interface StarsFutureConfig {
	/**
	 * The major whose defaults apply.
	 *
	 * `5` is the default: everything in `4`, plus `env` registered automatically in the built entry
	 * (see {@link StarsConfig.env}) when the project depends on `@wolfstar/env-utilities`.
	 *
	 * `4`:
	 * - auto imports are on by default with the `tsdown` build tool ({@link StarsImportsConfig}), and the
	 *   `autoImports()` plugin is wired into the build by `stars` itself.
	 * - `tsdown` is configured from {@link StarsConfig.tsdown} only. A `tsdown.config.*` in the project root is
	 *   rejected rather than silently ignored, so a build never loses the plugins it declares.
	 * - `build.tool: 'auto'` resolves to `tsdown` for any TypeScript entry, without looking for a `tsdown.config.*`
	 *   or a `tsdown` dependency first.
	 * - `env` is opt-in.
	 *
	 * `3` (**end-of-life**) keeps the legacy behaviour: auto imports off unless asked for, and a `tsdown.config.*`
	 * loaded and merged with {@link StarsConfig.tsdown}. It prints a warning and is removed in the next major.
	 * @default 5
	 */
	compatibilityVersion?: StarsCompatibilityVersion;
}

/**
 * The type checker `stars dev` runs next to the bot.
 *
 * - `tsc`: the project's own TypeScript, in watch mode.
 * - `golar`: the project's `golar`, forwarding to TypeScript (`golar tsc`), in watch mode.
 * - `tsz`: the project's `tsz` (or `try-tsz`). It has no watch mode, so it is re-run after every build instead.
 * - `auto`: `golar` when the project depends on it, `tsc` otherwise (default).
 */
export type StarsTypechecker = 'tsc' | 'golar' | 'tsz';

export interface StarsTypecheckConfig {
	/**
	 * The `tsconfig.json` the type checker runs against, relative to {@link StarsConfig.root}.
	 * @default the build tool's tsconfig, 'src/tsconfig.json' or 'tsconfig.json'
	 */
	tsconfig?: string;
	/**
	 * Which type checker to run.
	 * @default 'auto'
	 */
	checker?: StarsTypechecker | 'auto';
}

export interface StarsTunnelConfig {
	/**
	 * An https URL you already serve; when unset a `cloudflared` quick tunnel is opened instead.
	 */
	url?: string;
	/**
	 * Writes the tunnel's URL to the Discord application's `interactions_endpoint_url` when it changes.
	 *
	 * This edits a live Discord application, so it is opt-in: it needs `DISCORD_TOKEN` and `DISCORD_APPLICATION_ID`
	 * (or `APPLICATION_ID`) in the environment or the project's `.env`.
	 * @default false
	 */
	updateEndpoint?: boolean;
	/**
	 * The path the interactions endpoint is served on, appended to the tunnel URL.
	 * @default '/'
	 */
	path?: string;
}

/** The severities a dev log entry can be filtered by, from the most verbose to the most severe. */
export type StarsLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface StarsDevLogsConfig {
	/**
	 * The channels shown when `stars dev` starts (`cli`, `build`, `bot`, `types`, `tunnel`, `hmr`, `commands`,
	 * `interactions`, `http`, `lifecycle`, or one a plugin logs on). Every other channel starts hidden; the dev UI can
	 * still toggle each of them, and the log file always receives everything.
	 * @default every channel
	 */
	channels?: string[];
	/**
	 * The levels shown when `stars dev` starts.
	 * @default ['error', 'warn', 'info', 'debug']
	 */
	levels?: StarsLogLevel[];
	/**
	 * A directory, relative to {@link StarsConfig.root}, that receives one log file per `stars dev` run
	 * (`dev-<timestamp>.log`), next to {@link StarsDevConfig.logFile} which only keeps the latest run.
	 * @default false
	 */
	dir?: string | false;
	/**
	 * How many per-run files {@link StarsDevLogsConfig.dir} keeps, the file of the current run included; older ones
	 * are deleted when a run starts. A positive integer: `1` keeps only the current run.
	 * @default 10
	 */
	keep?: number;
}

export interface StarsDevCommandsConfig {
	/**
	 * What `stars dev` does when the application commands the bot registers differ from the ones it saw before:
	 *
	 * - `'prompt'`: ask in the dev UI (`Refresh commands? (y/n)`) and redeploy on `y`. Without the interactive UI
	 *   (`--no-tui`, CI) the change is only reported.
	 * - `'auto'`: redeploy right away.
	 * - `'off'`: only report the change.
	 *
	 * Needs `@wolfstar/http-framework` 6.1 or later in the project: the bot reports its commands to the CLI itself.
	 * @default 'prompt'
	 */
	refresh?: 'prompt' | 'auto' | 'off';
}

export interface StarsDevConfig {
	/** Custom terminal wordmark (one or more lines), or `false` to hide it. Defaults to the Stars wordmark. */
	banner?: string | readonly string[] | false;
	/**
	 * The interactive dev UI: `'dashboard'` is the full-screen view (status sidebar, channel and level filters, the
	 * log stream), `'panel'` the compact one pinned to the bottom of the terminal with the logs folded away. `'auto'`
	 * picks the dashboard when the terminal is at least 90 columns by 20 rows.
	 * @default 'auto'
	 */
	layout?: 'auto' | 'dashboard' | 'panel';
	/** Which log channels and levels the dev UI starts with, and where a run's logs are kept. */
	logs?: StarsDevLogsConfig;
	/** How `stars dev` reacts when the bot's application commands change. */
	commands?: StarsDevCommandsConfig;
	/**
	 * Leaves a change to the bot's own hot reload instead of restarting it, when the bot runs with `hmr` enabled and
	 * every file the build changed is a piece it watches. Anything else still restarts the bot. `false` always
	 * restarts.
	 * @default true
	 */
	hmr?: boolean;
	/**
	 * Extra paths to watch, relative to {@link StarsConfig.root}. Only used when
	 * the build tool is `none`; `tsdown` and `tsc` watch through their own build.
	 * @default [dirname(entry)]
	 */
	watch?: string[];
	/**
	 * Glob patterns or paths to ignore while watching, relative to {@link StarsConfig.root}.
	 * @default ['**\/node_modules/**', '**\/dist/**', '**\/.git/**']
	 */
	ignore?: string[];
	/**
	 * Milliseconds to wait after a change before restarting the bot.
	 * @default 150
	 */
	debounce?: number;
	/**
	 * Environment variables added to the bot process.
	 */
	env?: Record<string, string>;
	/**
	 * Arguments passed to `node` before the entry file.
	 * @default ['--enable-source-maps']
	 */
	nodeArgs?: string[];
	/**
	 * Arguments passed to the bot after the entry file.
	 * @default []
	 */
	args?: string[];
	/**
	 * The URL the bot listens on, shown in the dev UI's status line and used for {@link StarsDevConfig.health}.
	 *
	 * Resolved automatically, the way Vite's and Nuxt's dev servers do, from (in order) `dev.env.HTTP_PORT`, the
	 * process's `HTTP_PORT`, the project's `src/.env*`/`.env*` (`HTTP_PORT` or `PORT`), or `3000`. `stars dev` also
	 * resolves whether `localhost` should be shown as `127.0.0.1` instead, the same DNS-order check Vite does, so the
	 * printed URL is always the one that is actually reachable.
	 * @default `http://localhost:3000` (or whichever port is found)
	 */
	url?: string;
	/**
	 * A path, relative to {@link StarsDevConfig.url}, polled to report the bot's health in the dev UI.
	 * When unset the dev UI only reports process state.
	 */
	health?: string;
	/**
	 * Milliseconds to wait for the bot to exit after `SIGTERM` before killing it.
	 * @default 5000
	 */
	killTimeout?: number;
	/**
	 * Runs a type checker next to the bot and reports type errors on the dev UI's `tsc` channel, without blocking
	 * builds or restarts. `true` uses the project's own tsconfig and type checker, an object picks either
	 * ({@link StarsTypecheckConfig.checker}).
	 * @default false
	 */
	typecheck?: boolean | StarsTypecheckConfig;
	/**
	 * Exposes the bot's HTTP interactions endpoint publicly while `stars dev` runs, so Discord can reach it.
	 *
	 * `true` opens a `cloudflared` quick tunnel (its hostname changes on every run), a string is an https URL you
	 * already serve yourself (named tunnel, reverse proxy, …) that the CLI only checks for reachability.
	 * @default false
	 */
	tunnel?: boolean | string | StarsTunnelConfig;
	/**
	 * The file `stars dev` mirrors its logs into, relative to {@link StarsConfig.root}, so a session can be read back
	 * after the terminal UI is gone. `false` disables it.
	 * @default '.stars/dev.log'
	 */
	logFile?: string | false;
}

export interface StarsI18nCodegenConfig {
	/**
	 * The base locale directory, relative to {@link StarsConfig.root}.
	 * @default 'src/locales/en-US'
	 */
	locales?: string;
	/**
	 * The generated declaration file, relative to {@link StarsConfig.root}.
	 * @default 'src/@types/i18next.d.ts'
	 */
	output?: string;
}

export interface StarsCommandsCodegenConfig {
	/**
	 * The generated declaration file, relative to {@link StarsConfig.root}.
	 * @default 'src/@types/commands.d.ts'
	 */
	output?: string;
}

export interface StarsCodegenConfig {
	/**
	 * i18next type generation through `@wolfstar/i18next-type-generator`.
	 * `false` disables it, an object enables it, unset auto-detects from the presence of the locales directory.
	 */
	i18n?: StarsI18nCodegenConfig | false;
	/**
	 * Typed command options, generated from the commands the project registers (see `Command.OptionsOf`). It needs a
	 * build (`stars build`): the commands are read from the built bot, the same way `stars commands diff` does, because
	 * only running the builders (loops, factories, localized names) gives the exact payload Discord receives.
	 * `true` enables it with the default output, an object configures it, and it is off when unset.
	 */
	commands?: StarsCommandsCodegenConfig | boolean;
}

export interface StarsImportsConfig {
	/**
	 * Whether auto imports are enabled. Requires the `tsdown` build tool: the imports are injected at build time by
	 * the `autoImports()` plugin from `@wolfstar/http-framework/auto-imports`, which the other tools cannot run.
	 * @default true when the build tool is 'tsdown', false otherwise
	 */
	enabled?: boolean;
	/**
	 * Directories, relative to {@link StarsConfig.root}, whose exported values are auto-importable. Entries are glob
	 * path patterns: `'src/lib'` scans only the files directly inside it, `'src/lib/**'` scans recursively.
	 * @default ['src/lib/**', 'src/utils/**']
	 */
	dirs?: string[];
	/**
	 * Packages whose exports are auto-importable. Packages that are not installed are skipped.
	 * @default ['@wolfstar/http-framework', '@wolfstar/decorators', '@wolfstar/env-utilities']
	 */
	presets?: string[];
	/**
	 * Export names excluded from auto imports, e.g. to avoid clashes with project-local names.
	 * @default []
	 */
	exclude?: string[];
	/**
	 * The generated declaration file that types the auto imports, relative to {@link StarsConfig.root}.
	 * Include it in the project's tsconfig and add its directory to .gitignore.
	 * @default '.stars/imports.d.ts'
	 */
	dts?: string;
}

/**
 * The [Nitro preset](https://nitro.build/deploy) `stars build` targets, only reachable once
 * {@link StarsExperimentalConfig.enableNitro} (itself gated on {@link StarsExperimentalConfig.enableVite}) is `true`
 * — see {@link StarsExperimentalConfig}.
 */
export interface StarsNitroConfig {
	/** Additional Nitro options (routeRules, runtimeConfig, storage, publicAssets, hooks, etc.).
	 * Use `defineNitroConfig` from `@wolfstar/nitro-server` for upstream option completion.
	 * Stars owns rootDir, serverEntry, output.dir and the reserved virtual entry.
	 */
	[option: string]: unknown;
	/**
	 * `'node-server'` (the default, runs locally with plain `node`), `'cloudflare-module'`, `'aws-lambda'`,
	 * `'vercel'`, `'netlify'`, `'bun'`, `'deno-deploy'`, and more — see Nitro's own preset list.
	 * @default 'node-server'
	 */
	preset?: string;
}

/**
 * Opt-in flags for work that is still landing, in the shape Nuxt's own `experimental` block has: every flag is a
 * boolean, defaults to `false`, and is documented with what it changes and what it still needs. A flag stays here
 * until the behaviour it guards is the default (or is dropped), so enabling one is a statement that breakage is
 * acceptable in exchange for the feature.
 *
 * `enableExternalVite`, `enableNitro` and `nitro` build on `enableVite` (and `nitro` on `enableNitro` too): the type
 * only accepts them once their prerequisite is `true`, so turning one on without the other is a type error here
 * instead of a diagnostic at load time.
 */
export type StarsExperimentalConfig =
	| { enableVite?: false; enableExternalVite?: false; enableNitro?: false }
	| {
			/**
			 * Uses Vite as the project's build tool, in place of `tsdown`. `build.tool` may then be set to `'vite'`
			 * (and `'auto'` detects a `vite.config.*`); the bot keeps calling `client.listen()` and running as a
			 * plain `node:http` process, restarted on every change — this only swaps the bundler.
			 */
			enableVite: true;
			/**
			 * Runs the bot through Vite itself, the way `nuxt dev` runs on Vite's own dev server: instead of
			 * building then restarting a child `node` process on every change, `stars dev` loads the entry through
			 * Vite's SSR module graph and serves it — through `Client#fetch` — from one long-lived process,
			 * invalidating and re-evaluating just the entry's module graph on a change instead of restarting.
			 *
			 * With this on, the entry's default export must be the `Client` instance (already `load()`ed, not
			 * `listen()`ed) rather than a script that calls `client.listen()` itself — `stars dev` owns the socket.
			 * @default false
			 */
			enableExternalVite?: boolean;
			enableNitro?: false;
	  }
	| {
			enableVite: true;
			enableExternalVite?: boolean;
			/**
			 * Builds the bot through [Nitro](https://nitro.build) instead of a `node:http` server, so `stars build`
			 * produces a server deployable to any of Nitro's presets (`node-server` locally, `cloudflare-module`,
			 * `aws-lambda`, `vercel`, `netlify`, `bun`, `deno-deploy`, and more). Nitro v3 is itself a Vite plugin, so
			 * this builds through the project's own `vite.config.*`/{@link StarsConfig.vite} the same way `build.tool:
			 * 'vite'` does, with a generated server entry that wraps the entry's default export (the `Client`
			 * instance, already `load()`ed rather than `listen()`ed — `stars build`/`stars dev` own the socket) in a
			 * call to `Client#fetch` — no per-preset adapter to maintain.
			 *
			 * Output goes to `.output/` (Nitro's own convention) instead of `build.outDir`. `stars dev` rebuilds and
			 * restarts on every change, the same as the other build tools.
			 */
			enableNitro: true;
			/** Nitro-specific options, reachable only with `enableNitro: true`. */
			nitro?: StarsNitroConfig;
	  };

/**
 * The serializable subset of `@wolfstar/env-utilities`' `EnvSetupOptions`. These options are written into the built
 * entry as JSON, which is why `path` is a string only and `processEnv` is not available. A type test in
 * `@wolfstar/env-utilities` keeps the two in sync.
 */
export interface StarsEnvSetupOptions {
	/**
	 * A custom `.env` path. Kept relative: `@wolfstar/env-utilities` resolves it against the bot's working directory
	 * at runtime, so the build output does not depend on the machine it was built on.
	 * @default `src/.env*`, then `.env*`
	 */
	path?: string;
	/** A custom environment name, when `NODE_ENV` is not sufficient. */
	env?: string;
	/** Only keep the variables starting with this prefix (e.g. `BOT_`). */
	prefix?: string;
	/**
	 * **Experimental.** `'node'` parses the files with Node.js' own `util.parseEnv`, `'dotenv'` with `dotenv` and
	 * `dotenv-expand` (optional packages of `@wolfstar/env-utilities`), and `'varlock'` resolves the environment through
	 * [varlock](https://varlock.dev). When left out, `'varlock'` is used for a project with a `.env.schema`, otherwise
	 * `'dotenv'` if it is installed and `'node'` if it is not.
	 */
	loader?: 'node' | 'dotenv' | 'varlock';
	/** Logs every file loaded and every prefix match. */
	debug?: boolean;
	/**
	 * The encoding of the `.env` files.
	 * @default 'utf8'
	 */
	encoding?: string;
}

/**
 * The environment `stars` registers in the built entry before any other module runs, the way a hand-written
 * `setup()` from `@wolfstar/env-utilities` would. On by default from `future.compatibilityVersion: 5` when the project
 * depends on `@wolfstar/env-utilities`, except with `experimental.enableNitro`.
 */
export interface StarsEnvConfig extends StarsEnvSetupOptions {
	/** `false` turns the automatic registration off while keeping the options (e.g. for `stars dev`'s port lookup). */
	enabled?: boolean;
}

export interface StarsConfig {
	/**
	 * The project root. Relative paths are resolved from the configuration file.
	 * @default dirname(configFile)
	 */
	root?: string;
	/**
	 * The source entry point of the bot, relative to {@link StarsConfig.root}.
	 * @default the first of 'src/main.ts', 'src/main.js', 'src/index.ts', 'src/index.js' that exists
	 */
	entry?: string;
	build?: StarsBuildConfig;
	dev?: StarsDevConfig;
	codegen?: StarsCodegenConfig;
	/**
	 * Nuxt-style auto imports of the framework's exports and the project's own modules.
	 * `false` disables them, `true` forces them on (requires the `tsdown` build tool). On by default with
	 * `future.compatibilityVersion` 4 and later.
	 */
	imports?: StarsImportsConfig | boolean;
	/**
	 * `@wolfstar/env-utilities` options, registered automatically before the bot's own modules run.
	 * `false` disables the automatic registration, `true` forces it on with defaults.
	 */
	env?: StarsEnvConfig | boolean;
	/**
	 * Lifecycle hooks of the `stars` CLI (see `StarsHooks`), keyed by full name (`'build:done'`) or nested under
	 * their namespace (`{ build: { done() {} } }`). Each value is a function or an array of functions.
	 */
	hooks?: StarsHooksConfig;
	/**
	 * Installable modules (see `defineModule` in `@wolfstar/kit`), each a package name or a `[name, options]` tuple.
	 * A package listed here is installed because the project says so, not because of its name: it is no longer
	 * activated through the `@wolfstar/plugin-*` `/register` import the CLI otherwise injects. Falsy entries are
	 * dropped.
	 */
	modules?: readonly (StarsModuleEntry | false | null | undefined)[];
	/** Opt-in flags for behaviour that is still landing. */
	experimental?: StarsExperimentalConfig;
	/** Build-default compatibility. Omit for version 5; version 3 is end-of-life and only meant for migrating a standalone tsdown config. */
	future?: StarsFutureConfig;
	/**
	 * Raw options merged into `vite.config.*`, the way `vite: {}` in a Nuxt config is merged into Nuxt's own Vite
	 * config. Only used with `build.tool: 'vite'` (see `experimental.enableVite`).
	 */
	vite?: StarsViteConfig;
	/**
	 * The project's `tsdown` build. Replaces `tsdown.config.*` from `future.compatibilityVersion: 4` on, and is merged
	 * over it with `3`. Only used with `build.tool: 'tsdown'`.
	 */
	tsdown?: StarsTsdownConfig;
}
