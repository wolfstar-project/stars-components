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
	// root files. The merge below keeps the first value found, so the order of this list is the precedence order.
	const dotenvFiles = suffixes.flatMap((suffix) => dotenvPaths.map((path) => appendSuffix(path, suffix)));

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L36-L49}
	 */
	let parsed: DotenvParseOutput = {};

	// Parse every file first without expanding anything: expanding file by file would resolve references against
	// the files loaded so far only, so a specific file (e.g. `.env.local`) could never reference a variable defined
	// in a more generic one (e.g. `.env`). Files are parsed into one shared scratch object so `process.env` stays
	// untouched until all files are merged, while dotenv still sees its own `DOTENV_CONFIG_*` switches (from the real
	// environment or from an earlier file) the way it would when writing to `process.env`.
	const scratch = dotenvSettingsFromProcessEnv();
	for (const dotenvFile of dotenvFiles) {
		const dotenvFileString = typeof dotenvFile === 'string' ? dotenvFile : fileURLToPath(dotenvFile);

		log(`loading \`${basename(dotenvFileString)}\``);

		const result = config({
			debug: options?.debug,
			encoding: options?.encoding,
			path: dotenvFile,
			processEnv: scratch
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
	const alreadySet = new Set(Object.keys(parsed).filter((key) => process.env[key]));
	for (const key of findReferenceCycles(parsed, alreadySet)) {
		log(`\`${key}\` is part of a circular reference and resolves to an empty string`);
		parsed[key] = '';
	}

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

/**
 * Finds the variables that take part in a reference cycle spanning several variables (`A=${B}`, `B=${A}`).
 *
 * dotenv-expand only stops a cycle when a substituted value equals a whole intermediate result, so once a value
 * around the cycle carries a prefix or suffix (e.g. `C=${B}z`) it never terminates. Resolving the variables of such
 * a cycle to an empty string beforehand keeps loading bounded. Variables already set in `process.env` are left out,
 * as `expand` uses their existing value instead of expanding the one from the file. A variable referencing itself
 * is left alone too: dotenv-expand handles that case on its own.
 */
function findReferenceCycles(parsed: DotenvParseOutput, alreadySet: ReadonlySet<string>): Set<string> {
	const references = new Map<string, string[]>();
	for (const [key, value] of Object.entries(parsed)) {
		if (alreadySet.has(key)) continue;

		const targets = new Set<string>();
		for (const match of value.matchAll(/(?<!\\)\$\{?([A-Za-z_][A-Za-z0-9_]*)/g)) {
			const target = match[1];
			if (target !== key && target in parsed && !alreadySet.has(target)) targets.add(target);
		}

		references.set(key, [...targets]);
	}

	// Tarjan's strongly connected components: every component with more than one variable is a cycle.
	const cyclic = new Set<string>();
	const indexes = new Map<string, number>();
	const lowLinks = new Map<string, number>();
	const stack: string[] = [];
	const onStack = new Set<string>();
	let counter = 0;

	const visit = (key: string): void => {
		indexes.set(key, counter);
		lowLinks.set(key, counter);
		counter++;
		stack.push(key);
		onStack.add(key);

		for (const target of references.get(key) ?? []) {
			if (!indexes.has(target)) {
				visit(target);
				lowLinks.set(key, Math.min(lowLinks.get(key)!, lowLinks.get(target)!));
			} else if (onStack.has(target)) {
				lowLinks.set(key, Math.min(lowLinks.get(key)!, indexes.get(target)!));
			}
		}

		if (lowLinks.get(key) !== indexes.get(key)) return;

		const component: string[] = [];
		let member: string;
		do {
			member = stack.pop()!;
			onStack.delete(member);
			component.push(member);
		} while (member !== key);

		if (component.length > 1) for (const item of component) cyclic.add(item);
	};

	for (const key of references.keys()) {
		if (!indexes.has(key)) visit(key);
	}

	return cyclic;
}

function appendSuffix(path: string | URL, suffix: string): string | URL {
	if (typeof path === 'string') return `${path}${suffix}`;
	const file = fileURLToPath(path);
	return join(dirname(file), `${basename(file)}${suffix}`);
}

interface FSError extends Error {
	code: string;
}
