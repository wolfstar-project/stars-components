import { container } from '@sapphire/pieces';
import { config, populate, type DotenvConfigOptions, type DotenvConfigOutput, type DotenvParseOutput } from 'dotenv';
import { expand } from 'dotenv-expand';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface EnvLoaderOptions extends Omit<DotenvConfigOptions, 'path'> {
	/**
	 * You may specify a custom environment if `NODE_ENV` isn't sufficient.
	 */
	env?: string;
	/**
	 * You may specify a required prefix for your dotenv variables (ex. `APP_`).
	 */
	prefix?: string;
	/**
	 * Specify a custom path if your file containing environment variables is located elsewhere.
	 * Can also be an array of strings, specifying multiple paths.
	 *
	 * @default `src/.env*`, then `.env*` in `process.cwd()`
	 *
	 * @example with CJS
	 * ```typescript
	 * require('@wolfstar/env-utilities').setup({ path: '/custom/path/to/.env' })
	 * ```
	 * @example with ESM
	 * ```typescript
	 * import { setup } from '@wolfstar/env-utilities';
	 *
	 * const envFile = new URL('../.env', import.meta.url);
	 * setup({ path: envFile })
	 * ```
	 */
	path?: string | URL;
	/**
	 * **Experimental.** Selects the loader used to resolve environment variables.
	 *
	 * - `'dotenv'` (default): loads and merges `.env*` files with `dotenv`/`dotenv-expand`, as documented on the
	 *   other options.
	 * - `'varlock'`: delegates to {@link https://varlock.dev | varlock} instead of `dotenv`. Varlock resolves a
	 *   checked-in `.env.schema` (with its own `.env*` file discovery and validation) via its CLI and injects the
	 *   result into `process.env`. When selected, `encoding`, `path`, and `env` are ignored — configure the schema
	 *   itself instead. Requires the optional `varlock` package to be installed.
	 *
	 * @default 'dotenv'
	 */
	loader?: 'dotenv' | 'varlock';
}

const packageVersion: string = '[VI]{{inject}}[/VI]';

interface MinimalDebugLogger {
	debug(...values: readonly unknown[]): void;
}

function resolveDebugLogger(): MinimalDebugLogger {
	return (container as { logger?: MinimalDebugLogger }).logger ?? console;
}

export function loadEnvFiles(options?: EnvLoaderOptions): DotenvConfigOutput {
	const log = options?.debug
		? (message: string) => resolveDebugLogger().debug(`[@wolfstar/env-utilities@${packageVersion}] ${message}`)
		: () => undefined;

	if (options?.loader === 'varlock') {
		return loadWithVarlock(options, log);
	}

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L18-L23}
	 */
	if (!process.env.NODE_ENV) {
		throw new Error('The NODE_ENV environment variable is required but was not specified.');
	}

	const env = options?.env || process.env.NODE_ENV;
	const dotenvPaths = options?.path ? [options.path] : [resolve(process.cwd(), 'src', '.env'), resolve(process.cwd(), '.env')];

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L25-L34}
	 */
	const suffixes = [`.${env}.local`, ...(process.env.NODE_ENV === 'test' ? [] : ['.local']), `.${env}`, ''];
	// Specific files win over generic ones, while `src/.env*` wins over the corresponding root file. This keeps the
	// historical source-local convention working without configuration and still supports the ecosystem-standard
	// root files. dotenv itself preserves the first value loaded into process.env.
	const dotenvFiles = suffixes.flatMap((suffix) => dotenvPaths.map((path) => appendSuffix(path, suffix)));

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L36-L49}
	 */
	let parsed: DotenvParseOutput = {};

	// Parse every file first without expanding anything: expanding file by file would resolve references against
	// the files loaded so far only, so a specific file (e.g. `.env.local`) could never reference a variable defined
	// in a more generic one (e.g. `.env`). Each file is parsed into a scratch object so `process.env` stays untouched
	// until all files are merged.
	for (const dotenvFile of dotenvFiles) {
		const dotenvFileString = typeof dotenvFile === 'string' ? dotenvFile : fileURLToPath(dotenvFile);

		log(`loading \`${basename(dotenvFileString)}\``);

		const result = config({
			debug: options?.debug,
			encoding: options?.encoding,
			path: dotenvFile,
			processEnv: dotenvSettingsFromProcessEnv()
		});

		if (result.error) {
			if ((result.error as FSError).code === 'ENOENT') {
				log(`\`${basename(dotenvFileString)}\` file not found`);
				continue;
			}

			throw result.error;
		}

		// Files are loaded from the most specific to the most generic one, so the first value found wins.
		parsed = { ...result.parsed, ...parsed };
	}

	// Then inject the merged variables and expand them once. `populate` keeps values already present in process.env
	// (dotenv never overwrites them) and makes every variable visible to `expand`, so references resolve regardless
	// of the file, or the position within a file, they are defined in. `expand` itself also leaves a non-empty
	// process.env value untouched.
	populate(process.env, parsed, { debug: options?.debug });
	parsed = expand({ parsed }).parsed!;

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L72-L89}
	 */
	if (options?.prefix) {
		parsed = filterByPrefix(parsed, options.prefix, log);
	}

	return {
		parsed
	};
}

/**
 * **Experimental.** Resolves environment variables via {@link https://varlock.dev | varlock} instead of `dotenv`.
 *
 * Varlock ships no synchronous "parse only" API comparable to `dotenv.config()`; its documented Node.js
 * integration (`varlock/auto-load`) resolves the configured `.env.schema` by shelling out to its CLI and injects
 * the result directly into `process.env`. To still return a `dotenv`-compatible {@link DotenvConfigOutput}, this
 * diffs `process.env` before and after loading and reports the keys varlock added or changed.
 */
function loadWithVarlock(options: EnvLoaderOptions, log: (message: string) => void): DotenvConfigOutput {
	log('resolving environment variables via varlock');

	const before = { ...process.env };

	try {
		createRequire(import.meta.url)('varlock/auto-load');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
			throw new Error(
				"The 'varlock' loader was requested, but the optional `varlock` package is not installed. Install it with your package manager (e.g. `pnpm add varlock`) to use it."
			);
		}

		throw error;
	}

	let parsed: DotenvParseOutput = {};
	for (const [key, value] of Object.entries(process.env)) {
		// Varlock stores its own resolved-config blob (and related bookkeeping) on `process.env` under these
		// internal keys; they are not user-facing variables and must not leak into the returned `parsed` map.
		if (/^_{1,2}VARLOCK_/i.test(key)) continue;
		if (value !== undefined && before[key] !== value) {
			log(`\`${key}\` resolved via varlock`);
			parsed[key] = value;
		}
	}

	if (options.prefix) {
		parsed = filterByPrefix(parsed, options.prefix, log);
	}

	return {
		parsed
	};
}

function filterByPrefix(parsed: DotenvParseOutput, prefix: string, log: (message: string) => void): DotenvParseOutput {
	const prefixRegExp = new RegExp(`^${prefix}`, 'i');
	return Object.keys(parsed)
		.filter((key) => {
			const match = prefixRegExp.test(key);
			log(`Prefix for key \`${key}\` ${match ? 'matches' : 'does not match'} \`${prefix}\``);
			return match;
		})
		.reduce<DotenvParseOutput>((obj, key) => {
			obj[key] = parsed[key];
			return obj;
		}, {});
}

/**
 * dotenv reads its own `DOTENV_CONFIG_DEBUG` and `DOTENV_CONFIG_QUIET` switches from the `processEnv` it writes to,
 * so forward the ones set in the real environment to the scratch object used while parsing.
 */
function dotenvSettingsFromProcessEnv(): Record<string, string> {
	const settings: Record<string, string> = {};
	for (const key of ['DOTENV_CONFIG_DEBUG', 'DOTENV_CONFIG_QUIET']) {
		const value = process.env[key];
		if (value !== undefined) settings[key] = value;
	}

	return settings;
}

function appendSuffix(path: string | URL, suffix: string): string | URL {
	if (typeof path === 'string') return `${path}${suffix}`;
	const file = fileURLToPath(path);
	return join(dirname(file), `${basename(file)}${suffix}`);
}

interface FSError extends Error {
	code: string;
}
