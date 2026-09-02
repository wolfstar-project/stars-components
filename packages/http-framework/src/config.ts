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
 * - `tsdown`: run the project's own `tsdown` (configuration file included) programmatically.
 * - `tsc`: run the project's `tsc -b` on the configured `tsconfig`.
 * - `none`: the entry is runnable as-is (JavaScript projects), no build step.
 * - `auto`: detect from the project (default).
 */
export type StarsBuildTool = 'tsdown' | 'tsc' | 'none';

export interface StarsBuildConfig {
	/**
	 * The build tool to use.
	 * @default 'auto'
	 */
	tool?: StarsBuildTool | 'auto';
	/**
	 * The directory, relative to {@link StarsConfig.root}, the build writes into.
	 * @default 'dist'
	 */
	outDir?: string;
	/**
	 * The `tsconfig.json` used by the `tsc` build tool, relative to {@link StarsConfig.root}.
	 * @default 'src/tsconfig.json' when it exists, 'tsconfig.json' otherwise
	 */
	tsconfig?: string;
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
	 * `false` disables them, `true` forces them on (requires the `tsdown` build tool).
	 */
	imports?: StarsImportsConfig | boolean;
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
