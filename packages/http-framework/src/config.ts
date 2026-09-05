/**
 * Public, side-effect free configuration surface of `@wolfstar/cli`.
 *
 * This module is intentionally tiny: importing it from a `stars.config.ts`
 * file must never start the bot nor pull the heavy runtime of the CLI.
 *
 * @module @wolfstar/http-framework/config
 */

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
 * With {@link StarsFutureConfig.compatibilityVersion} `4` these replace `tsdown.config.*` outright: the build is
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
 * The `stars` major version whose defaults the project runs on, the way Nuxt's own `future.compatibilityVersion`
 * makes the next major's defaults available one major early.
 */
export type StarsCompatibilityVersion = 3 | 4;

/**
 * Nuxt-style `future` block: defaults that are already decided for the next major, available today. Where
 * `experimental` guards work that is still landing and may change shape, everything here is settled — it only waits
 * for a major to become the default.
 */
export interface StarsFutureConfig {
	/**
	 * The major whose defaults apply.
	 *
	 * `4` turns on the next major's build pipeline:
	 * - auto imports are on by default with the `tsdown` build tool ({@link StarsImportsConfig}), and the
	 *   `autoImports()` plugin is wired into the build by `stars` itself.
	 * - `tsdown` is configured from {@link StarsConfig.tsdown} only. A `tsdown.config.*` in the project root is
	 *   rejected rather than silently ignored, so a build never loses the plugins it declares.
	 * - `build.tool: 'auto'` resolves to `tsdown` for any TypeScript entry, without looking for a `tsdown.config.*`
	 *   or a `tsdown` dependency first.
	 *
	 * `3` keeps today's behaviour: auto imports off unless asked for, and a `tsdown.config.*` loaded and merged with
	 * {@link StarsConfig.tsdown}.
	 * @default 3
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

export interface StarsDevConfig {
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
	 * process's `HTTP_PORT`, the project's `.env.local`/`.env` (`HTTP_PORT` or `PORT`), or `3000`. `stars dev` also
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

export interface StarsCodegenConfig {
	/**
	 * i18next type generation through `@wolfstar/i18next-type-generator`.
	 * `false` disables it, an object enables it, unset auto-detects from the presence of the locales directory.
	 */
	i18n?: StarsI18nCodegenConfig | false;
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
	 * @default ['@wolfstar/http-framework', '@wolfstar/env-utilities']
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
 * instead of a `ConfigError` at load time.
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
			 * Vite's SSR module graph and serves it — through `@wolfstar/http-framework/fetch`'s
			 * `createFetchHandler` — from one long-lived process, invalidating and re-evaluating just the entry's
			 * module graph on a change instead of restarting.
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
			 * `aws-lambda`, `vercel`, `netlify`, `bun`, `deno-deploy`, and more) from the same
			 * `@wolfstar/http-framework/fetch` handler `enableExternalVite` already runs in dev — no per-platform
			 * adapter to maintain.
			 *
			 * Output goes to `.output/` (Nitro's own convention) instead of `build.outDir`. The entry's default
			 * export must be the `Client` instance, the same as `enableExternalVite`.
			 */
			enableNitro: true;
			/** Nitro-specific options, reachable only with `enableNitro: true`. */
			nitro?: StarsNitroConfig;
	  };

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
	 * `future.compatibilityVersion: 4`.
	 */
	imports?: StarsImportsConfig | boolean;
	/** Opt-in flags for behaviour that is still landing. */
	experimental?: StarsExperimentalConfig;
	/** The next major's defaults, available today. */
	future?: StarsFutureConfig;
	/**
	 * Raw options merged into `vite.config.*`, the way `vite: {}` in a Nuxt config is merged into Nuxt's own Vite
	 * config. Only used with `build.tool: 'vite'` (see `experimental.enableVite`).
	 */
	vite?: StarsViteConfig;
	/**
	 * The project's `tsdown` build. Replaces `tsdown.config.*` with `future.compatibilityVersion: 4`, and is merged
	 * over it with `3`. Only used with `build.tool: 'tsdown'`.
	 */
	tsdown?: StarsTsdownConfig;
}

/**
 * Typed helper for `stars.config.{ts,mts,cts,js,mjs,cjs}` files.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@wolfstar/http-framework/config';
 *
 * export default defineConfig({
 * 	entry: 'src/main.ts',
 * 	build: { tool: 'tsdown' }
 * });
 * ```
 */
export function defineConfig(config: StarsConfig): StarsConfig {
	return config;
}

export * from './lib/config/index.js';
