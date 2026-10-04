import { container } from '@sapphire/pieces';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expand as expandNode } from './expand';

/** The variables a loader resolved, as `dotenv`'s `config()` reports them. */
export interface EnvLoaderOutput {
	parsed?: Record<string, string>;
	error?: Error;
}

type DotenvParseOutput = Record<string, string>;

export interface EnvLoaderOptions {
	/**
	 * Logs which files are loaded and why a key was or was not set, to help debug missing keys or values.
	 */
	debug?: boolean;
	/**
	 * The encoding of the files containing the environment variables (`dotenv` loader only).
	 *
	 * @default 'utf8'
	 */
	encoding?: string;
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
	 * - `'node'`: loads and merges the `.env*` files with Node.js' own parser (`util.parseEnv`, Node.js 20.12 or newer),
	 *   and expands `$VAR`, `${VAR}` and `${VAR:-default}` references the way `dotenv-expand` does. Needs no package.
	 * - `'dotenv'`: loads and merges the `.env*` files with `dotenv`/`dotenv-expand`, as documented on the other options.
	 *   Requires the optional `dotenv` and `dotenv-expand` packages to be installed.
	 * - `'varlock'`: delegates to {@link https://varlock.dev | varlock}. Varlock resolves a checked-in `.env.schema`
	 *   (with its own `.env*` file discovery and validation) via its CLI and injects the result into `process.env`.
	 *   When selected, `path` and `env` are passed to `varlock load` as `--path` and `--env`, `prefix` still filters the
	 *   returned `parsed`, and `encoding` is ignored. An invalid schema throws an `Error` with varlock's summary.
	 *   Requires the optional `varlock` package to be installed.
	 *
	 * When not set, `'varlock'` is used if a `.env.schema` is found (`src/.env.schema`, then `.env.schema` at the project
	 * root, or a `varlock.loadPath` in `package.json`), no `path` is set and `varlock` is installed. Otherwise `'dotenv'`
	 * is used if `dotenv` and `dotenv-expand` are installed, and `'node'` if they are not.
	 *
	 * @default detected
	 */
	loader?: 'node' | 'dotenv' | 'varlock';
}

const packageVersion: string = '[VI]{{inject}}[/VI]';

interface MinimalDebugLogger {
	debug(...values: readonly unknown[]): void;
}

function resolveDebugLogger(): MinimalDebugLogger {
	return (container as { logger?: MinimalDebugLogger }).logger ?? console;
}

export function loadEnvFiles(options?: EnvLoaderOptions): EnvLoaderOutput {
	const log = options?.debug
		? (message: string) => resolveDebugLogger().debug(`[@wolfstar/env-utilities@${packageVersion}] ${message}`)
		: () => undefined;

	// Detected before the `NODE_ENV` check below: varlock's `--env` is not required to be `NODE_ENV`.
	const loader = options?.loader ?? detectLoader(options, log);
	if (loader === 'varlock') {
		return loadWithVarlock(options ?? {}, log);
	}

	/**
	 * @see {@linkplain https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/env.js#L18-L23}
	 */
	if (!process.env.NODE_ENV) {
		throw new Error('The NODE_ENV environment variable is required but was not specified.');
	}

	const files = loader === 'dotenv' ? dotenvFileLoader(options) : nodeFileLoader(options);

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
	// in a more generic one (e.g. `.env`). `process.env` stays untouched until all files are merged.
	for (const dotenvFile of dotenvFiles) {
		const dotenvFileString = typeof dotenvFile === 'string' ? dotenvFile : fileURLToPath(dotenvFile);

		log(`loading \`${basename(dotenvFileString)}\``);

		const result = files.read(dotenvFile);
		if (result === undefined) {
			log(`\`${basename(dotenvFileString)}\` file not found`);
			continue;
		}

		// Files are loaded from the most specific to the most generic one, so the first value found wins.
		parsed = { ...result, ...parsed };
	}

	// Then inject the merged variables and expand them once. `populate` keeps values already present in process.env
	// (it never overwrites them) and makes every variable visible to `expand`, so references resolve regardless of the
	// file, or the position within a file, they are defined in. `expand` itself also leaves a non-empty process.env
	// value untouched.
	const alreadySet = new Set(Object.keys(parsed).filter((key) => process.env[key]));
	for (const key of findReferenceCycles(parsed, alreadySet)) {
		log(`\`${key}\` is part of a circular reference and resolves to an empty string`);
		parsed[key] = '';
	}

	files.populate(parsed);
	parsed = files.expand(parsed);

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
 * The part of varlock's `json-full` output that is read here.
 */
interface VarlockSerializedEnv {
	config: Record<string, { value?: unknown; envStr?: string } | undefined>;
	settings?: { injectUndefinedAsEmpty?: boolean };
}

/**
 * **Experimental.** Resolves environment variables via {@link https://varlock.dev | varlock} instead of `dotenv`.
 *
 * Runs `varlock load --format json-full` through varlock's own synchronous CLI helper, instead of importing
 * `varlock/auto-load`: the CLI returns exactly the resolved values (so `parsed` is not a diff of `process.env`),
 * honours `path` and `env`, and an invalid schema becomes a thrown `Error` rather than a `process.exit()`.
 * The resolved values are then injected into `process.env` and the typed `ENV` object of `varlock/env`, the way
 * `varlock/auto-load` does. Its runtime redaction and leak detection are not part of the CLI, import
 * `varlock/auto-load` as well to opt into them.
 */
function loadWithVarlock(options: EnvLoaderOptions, log: (message: string) => void): EnvLoaderOutput {
	log('resolving environment variables via varlock');

	const require = createRequire(import.meta.url);
	let varlock: typeof import('varlock/exec-sync-varlock');
	let varlockEnv: typeof import('varlock/env');
	try {
		varlock = require('varlock/exec-sync-varlock');
		varlockEnv = require('varlock/env');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
			throw new Error(
				"The 'varlock' loader was requested, but the optional `varlock` package is not installed. Install it with your package manager (e.g. `pnpm add varlock`) to use it."
			);
		}

		throw error;
	}

	const { args, cwd } = varlockLoadArguments(options.env, options.path ?? findVarlockSchema()?.path);
	log(`running \`varlock ${args.join(' ')}\`${cwd ? ` in \`${cwd}\`` : ''}`);

	let stdout: string;
	try {
		({ stdout } = varlock.execSyncVarlock(args.join(' '), {
			fullResult: true,
			callerDir: dirname(fileURLToPath(import.meta.url)),
			cwd: cwd ?? process.cwd(),
			env: varlockChildEnv()
		}));
	} catch (error) {
		if (error instanceof varlock.VarlockExecError) {
			throw new Error(error.stderr.trim() || error.message, { cause: error });
		}

		throw error;
	}

	const serialized = JSON.parse(stdout) as VarlockSerializedEnv;
	const injectUndefinedAsEmpty = serialized.settings?.injectUndefinedAsEmpty;

	let parsed: DotenvParseOutput = {};
	for (const [key, item] of Object.entries(serialized.config)) {
		const value = item?.envStr ?? (item?.value === undefined ? undefined : String(item.value));
		if (value === undefined && !injectUndefinedAsEmpty) continue;

		log(`\`${key}\` resolved via varlock`);
		parsed[key] = value ?? '';
	}

	// Populates `process.env` and the `ENV` object of `varlock/env`, as `varlock/auto-load` does.
	(globalThis as { __varlockLoadedEnv?: unknown }).__varlockLoadedEnv = serialized;
	varlockEnv.initVarlockEnv();

	if (options.prefix) {
		parsed = filterByPrefix(parsed, options.prefix, log);
	}

	return {
		parsed
	};
}

/**
 * The environment of `varlock load`. Its summary becomes the message of an `Error`, so colour is turned off: varlock
 * colours it even when it is not a TTY (`FORCE_COLOR`), and `FORCE_COLOR` wins over `NO_COLOR`.
 */
function varlockChildEnv(): NodeJS.ProcessEnv {
	const { FORCE_COLOR: _forceColor, ...env } = process.env;
	return { ...env, NO_COLOR: '1' };
}

/**
 * Builds the arguments of `varlock load`. The CLI helper splits its command on spaces, so an argument cannot contain
 * one: a `path` that does is passed relative to the directory the CLI runs in instead (so the name of a file, not of
 * a directory, cannot contain one).
 */
function varlockLoadArguments(env: string | undefined, path: string | URL | undefined): { args: string[]; cwd?: string } {
	const args = ['load', '--format', 'json-full', '--compact', '--summary-stderr'];
	let cwd: string | undefined;

	if (env) {
		assertNoWhitespace('env', env);
		args.push('--env', env);
	}

	if (path !== undefined) {
		const resolved = resolve(typeof path === 'string' ? path : fileURLToPath(path));
		if (/\s/.test(resolved)) {
			// `--path` is a directory or a file: run in the directory itself, or next to the file.
			const isDirectory = statSync(resolved, { throwIfNoEntry: false })?.isDirectory() ?? false;
			cwd = isDirectory ? resolved : dirname(resolved);
			if (!isDirectory) assertNoWhitespace('path', basename(resolved));
			args.push('--path', isDirectory ? '.' : basename(resolved));
		} else {
			args.push('--path', resolved);
		}
	}

	return { args, cwd };
}

/**
 * Picks the loader when none is requested: varlock if the project has a schema and `varlock` is installed, else
 * dotenv if `dotenv` and `dotenv-expand` are installed, else the `node` loader. An explicit `path` keeps the `.env*`
 * semantics (a base path of `.env*` files, not a schema location), so it never selects varlock on its own.
 */
function detectLoader(options: EnvLoaderOptions | undefined, log: (message: string) => void): 'node' | 'dotenv' | 'varlock' {
	if (options?.path === undefined && findVarlockSchema()) {
		if (isInstalled('varlock/exec-sync-varlock')) {
			log('found a varlock schema: using varlock');
			return 'varlock';
		}

		log('found a varlock schema, but `varlock` is not installed');
	}

	if (isInstalled('dotenv') && isInstalled('dotenv-expand')) {
		log('`dotenv` and `dotenv-expand` are installed: using dotenv');
		return 'dotenv';
	}

	log('using the `node` loader');
	return 'node';
}

function isInstalled(specifier: string): boolean {
	try {
		createRequire(import.meta.url).resolve(specifier);
		return true;
	} catch {
		return false;
	}
}

/**
 * Looks for a varlock schema the way `.env*` files are looked for: `src/.env.schema` first, then the project root.
 * `path` is only set for `src`, since `varlock load` already finds the root schema (or the `varlock.loadPath` of
 * `package.json`) from the current directory.
 */
function findVarlockSchema(): { path?: string } | undefined {
	const cwd = process.cwd();

	const src = resolve(cwd, 'src');
	if (existsSync(join(src, '.env.schema'))) return { path: src };

	if (existsSync(join(cwd, '.env.schema'))) return {};

	try {
		const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as { varlock?: { loadPath?: unknown } };
		if (pkg.varlock?.loadPath) return {};
	} catch {
		// No readable `package.json`: there is no `varlock.loadPath` to honour.
	}

	return undefined;
}

function assertNoWhitespace(name: string, value: string): void {
	if (/\s/.test(value)) {
		throw new Error(`The '${name}' option cannot contain whitespace when the 'varlock' loader is used, but received '${value}'.`);
	}
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

/** Reads one `.env*` file and injects the merged result: the part of a file loader that differs between the two. */
interface FileLoader {
	/** The variables of a file, or `undefined` when it does not exist. */
	read(file: string | URL): DotenvParseOutput | undefined;
	/** Sets the variables that are not in `process.env` yet. */
	populate(parsed: DotenvParseOutput): void;
	/** Expands the references of `parsed`, in place, and writes the result to `process.env`. */
	expand(parsed: DotenvParseOutput): DotenvParseOutput;
}

/** The `dotenv` loader: `dotenv` parses the files and `dotenv-expand` expands them. */
function dotenvFileLoader(options: EnvLoaderOptions | undefined): FileLoader {
	const { config, populate, expand } = requireDotenv();
	// Files are parsed into one shared scratch object so `process.env` stays untouched until all files are merged, while
	// dotenv still sees its own `DOTENV_CONFIG_*` switches (from the real environment or from an earlier file) the way
	// it would when writing to `process.env`.
	const scratch = dotenvSettingsFromProcessEnv();

	return {
		read(file) {
			const result = config({ debug: options?.debug, encoding: options?.encoding, path: file, processEnv: scratch });
			if (result.error) {
				if ((result.error as FSError).code === 'ENOENT') return undefined;
				throw result.error;
			}

			return result.parsed ?? {};
		},
		populate: (parsed) => void populate(process.env, parsed, { debug: options?.debug }),
		expand: (parsed) => expand({ parsed }).parsed!
	};
}

/** The `node` loader: `util.parseEnv` parses the files, and `expand` mirrors `dotenv-expand`. */
function nodeFileLoader(options: EnvLoaderOptions | undefined): FileLoader {
	// `util.parseEnv` is read at run time, not imported: it only exists from Node.js 20.12, and a named import would
	// stop the whole package from loading on an older version, varlock users included.
	const { parseEnv } = createRequire(import.meta.url)('node:util') as { parseEnv?: (content: string) => Record<string, string> };
	if (typeof parseEnv !== 'function') {
		throw new Error(
			`The 'node' loader needs Node.js 20.12 or newer (\`util.parseEnv\`), but this is ${process.version}. Upgrade Node.js, or install \`dotenv\` and \`dotenv-expand\` to use the 'dotenv' loader.`
		);
	}

	return {
		read(file) {
			let content: string;
			try {
				content = readFileSync(file, (options?.encoding ?? 'utf8') as BufferEncoding);
			} catch (error) {
				if ((error as FSError).code === 'ENOENT') return undefined;
				throw error;
			}

			return { ...parseEnv(content) };
		},
		populate(parsed) {
			for (const [key, value] of Object.entries(parsed)) {
				if (!(key in process.env)) process.env[key] = value;
			}
		},
		expand: (parsed) => expandNode(parsed)
	};
}

/**
 * `dotenv` and `dotenv-expand` are optional peer dependencies, so a project using the `varlock` loader does not have
 * to install them: they are only required here, when the `dotenv` loader actually runs.
 */
function requireDotenv(): {
	config: typeof import('dotenv').config;
	populate: typeof import('dotenv').populate;
	expand: typeof import('dotenv-expand').expand;
} {
	const require = createRequire(import.meta.url);
	const load = <T>(name: string): T => {
		try {
			return require(name) as T;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
				throw new Error(
					`The 'dotenv' loader needs the \`${name}\` package, which is an optional peer dependency of \`@wolfstar/env-utilities\`. Install it with your package manager (e.g. \`pnpm add ${name}\`), or use the 'varlock' loader.`,
					{ cause: error }
				);
			}

			throw error;
		}
	};

	const { config, populate } = load<typeof import('dotenv')>('dotenv');
	const { expand } = load<typeof import('dotenv-expand')>('dotenv-expand');
	return { config, populate, expand };
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
