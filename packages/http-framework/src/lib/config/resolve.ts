import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import type { Diagnostic } from 'nostics';
import type {
	StarsBuildTool,
	StarsCompatibilityVersion,
	StarsConfig,
	StarsDevConfig,
	StarsExperimentalConfig,
	StarsFutureConfig,
	StarsTypechecker
} from '../../config.js';
import { configDiagnostics } from './errors.js';

export interface PackageJsonLike {
	name?: string;
	/** `tsdown` reads its options from here as well as from a `tsdown.config.*`. */
	tsdown?: unknown;
	version?: string;
	main?: string;
	type?: string;
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

export interface ResolvedBuildConfig {
	readonly tool: StarsBuildTool;
	/** Absolute output directory. */
	readonly outDir: string;
	/** Absolute `tsconfig.json` used by `tsc`, `null` for the other tools. */
	readonly tsconfig: string | null;
	/** Absolute path of the file `node` runs, i.e. the built entry (or the entry itself when `tool` is `none`). */
	readonly output: string;
	/**
	 * Absolute path of the build tool's own configuration file (`tsdown.config.*`, `vite.config.*`), `null` when the
	 * tool has none — which is always the case for `tsdown` with `future.compatibilityVersion` 4, where the build is
	 * configured from `stars.config` alone.
	 */
	readonly configFile: string | null;
}

export interface ResolvedTypecheckConfig {
	readonly enabled: boolean;
	/** Absolute `tsconfig.json` the type checker runs against, `null` when it could not be found. */
	readonly tsconfig: string | null;
	/** The type checker to run, with `'auto'` already resolved. */
	readonly checker: StarsTypechecker;
}

export type ResolvedTunnelConfig =
	| { readonly mode: 'off' }
	/** A `cloudflared` quick tunnel, whose hostname is only known once it is up. */
	| { readonly mode: 'quick'; readonly path: string; readonly updateEndpoint: boolean }
	/** An https URL the user already serves. */
	| { readonly mode: 'url'; readonly url: string; readonly path: string; readonly updateEndpoint: boolean };

export interface ResolvedDevConfig {
	readonly banner: readonly string[] | false | null;
	readonly watch: readonly string[];
	readonly ignore: readonly string[];
	readonly debounce: number;
	readonly env: Readonly<Record<string, string>>;
	readonly nodeArgs: readonly string[];
	readonly args: readonly string[];
	readonly url: string | null;
	readonly health: string | null;
	readonly killTimeout: number;
	readonly typecheck: ResolvedTypecheckConfig;
	readonly tunnel: ResolvedTunnelConfig;
	/** Absolute path of the file the dev session's logs are mirrored into, `null` when disabled. */
	readonly logFile: string | null;
}

export interface ResolvedNitroConfig {
	readonly preset: string;
}

export interface ResolvedExperimentalConfig {
	readonly enableVite: boolean;
	readonly enableExternalVite: boolean;
	readonly enableNitro: boolean;
	readonly nitro: ResolvedNitroConfig;
}

export interface ResolvedFutureConfig {
	readonly compatibilityVersion: StarsCompatibilityVersion;
}

export interface ResolvedImportsConfig {
	readonly enabled: boolean;
	/** Directory glob patterns, relative to the project root (the way `unimport` scans them). */
	readonly dirs: readonly string[];
	readonly presets: readonly string[];
	readonly exclude: readonly string[];
	/** Absolute path of the generated declaration file. */
	readonly dts: string;
}

export interface ResolvedI18nCodegenConfig {
	readonly locales: string;
	readonly output: string;
}

export interface ResolvedCodegenConfig {
	readonly i18n: ResolvedI18nCodegenConfig | null;
}

export interface ResolvedStarsConfig {
	/** Absolute path of the configuration file, `null` when running on defaults. */
	readonly configFile: string | null;
	/** The directory the CLI was invoked from. */
	readonly cwd: string;
	/** Absolute project root. */
	readonly root: string;
	readonly packageJson: PackageJsonLike | null;
	/** Absolute source entry. */
	readonly entry: string;
	readonly build: ResolvedBuildConfig;
	readonly dev: ResolvedDevConfig;
	readonly codegen: ResolvedCodegenConfig;
	readonly imports: ResolvedImportsConfig;
	readonly experimental: ResolvedExperimentalConfig;
	readonly future: ResolvedFutureConfig;
	/** Raw options merged into `vite.config.*`. */
	readonly vite: Readonly<Record<string, unknown>>;
	/** The `tsdown` build's options: merged over `tsdown.config.*` at compatibility version 3, the whole build at 4. */
	readonly tsdown: Readonly<Record<string, unknown>>;
}

export interface ResolveConfigOptions {
	cwd: string;
	configFile: string | null;
	config: StarsConfig;
	env?: NodeJS.ProcessEnv;
}

export const DEFAULT_ENTRIES = ['src/main.ts', 'src/main.js', 'src/index.ts', 'src/index.js'] as const;
export const DEFAULT_IGNORE = ['**/node_modules/**', '**/dist/**', '**/.git/**'] as const;
export const DEFAULT_DEBOUNCE = 150;
export const DEFAULT_KILL_TIMEOUT = 5000;
export const DEFAULT_NODE_ARGS = ['--enable-source-maps'] as const;
export const DEFAULT_DEV_PORT = 3000;
export const DEFAULT_I18N_LOCALES = 'src/locales/en-US';
export const DEFAULT_I18N_OUTPUT = 'src/@types/i18next.d.ts';
export const DEFAULT_IMPORTS_DIRS = ['src/lib/**', 'src/utils/**'] as const;
export const DEFAULT_IMPORTS_PRESETS = ['@wolfstar/http-framework', '@wolfstar/env-utilities'] as const;
export const DEFAULT_IMPORTS_DTS = '.stars/imports.d.ts';
export const DEFAULT_DEV_LOG_FILE = '.stars/dev.log';
export const DEFAULT_TUNNEL_PATH = '/';

export const DEFAULT_COMPATIBILITY_VERSION = 4;
export const LEGACY_COMPATIBILITY_VERSION = 3;
export const LATEST_COMPATIBILITY_VERSION = 4;

const COMPATIBILITY_VERSIONS = new Set<number>([LEGACY_COMPATIBILITY_VERSION, LATEST_COMPATIBILITY_VERSION]);
const BUILD_TOOLS = new Set<string>(['tsdown', 'tsc', 'none', 'vite', 'auto']);
const TYPECHECKERS = new Set<string>(['tsc', 'golar', 'tsz', 'auto']);
const VITE_CONFIG_FILES = ['vite.config.ts', 'vite.config.mts', 'vite.config.cts', 'vite.config.js', 'vite.config.mjs', 'vite.config.cjs'];
const TSDOWN_CONFIG_FILES = [
	'tsdown.config.ts',
	'tsdown.config.mts',
	'tsdown.config.cts',
	'tsdown.config.js',
	'tsdown.config.mjs',
	'tsdown.config.cjs',
	'tsdown.config.json'
];
const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.mts', '.cts']);

/**
 * Applies defaults, validates every option and resolves all paths to absolute ones.
 *
 * @throws {Diagnostic} (from `nostics`, via {@link configDiagnostics}) with an actionable `fix` on the first invalid option.
 */
export function resolveStarsConfig(options: ResolveConfigOptions): ResolvedStarsConfig {
	const cwd = resolve(options.cwd);
	const env = options.env ?? process.env;
	const file = options.configFile;
	const config = options.config;
	const validator = new Validator(file);

	validator.knownKeys(config, '', ['root', 'entry', 'build', 'dev', 'codegen', 'imports', 'experimental', 'future', 'vite', 'tsdown']);
	const baseDirectory = file ? dirname(file) : cwd;

	const root = resolve(baseDirectory, validator.string(config.root, 'root') ?? '.');
	if (!isDirectory(root)) {
		throw validator.error(configDiagnostics.ROOT_NOT_FOUND, { root });
	}

	const packageJson = readPackageJson(root, validator);
	const experimental = resolveExperimental(config.experimental ?? {}, validator);
	const future = resolveFuture(config.future ?? {}, validator);
	const entry = resolveEntry(root, validator.string(config.entry, 'entry'), validator);
	// The tool-specific blocks are read before the build so a project that only declares `tsdown: {}` still resolves
	// `build.tool: 'auto'` to `tsdown`: configuring a tool is as clear a signal as depending on it.
	const vite = validator.plainObject(config.vite, 'vite') ?? {};
	const tsdown = validator.plainObject(config.tsdown, 'tsdown') ?? {};
	const build = resolveBuild(root, entry, packageJson, config.build ?? {}, experimental, future, Object.keys(tsdown).length > 0, validator);
	const dev = resolveDev(root, entry, packageJson, config.dev ?? {}, env, validator);
	const codegen = resolveCodegen(root, config.codegen ?? {}, validator);
	const imports = resolveImports(root, build.tool, future, config.imports, validator);

	if (Object.keys(tsdown).length > 0 && build.tool !== 'tsdown') {
		throw validator.error(configDiagnostics.TSDOWN_OPTIONS_REQUIRE_TSDOWN, { tool: build.tool });
	}

	if (Object.keys(vite).length > 0 && build.tool !== 'vite') {
		throw validator.error(configDiagnostics.VITE_OPTIONS_REQUIRE_VITE, { tool: build.tool });
	}

	return { configFile: file, cwd, root, packageJson, entry, build, dev, codegen, imports, experimental, future, vite, tsdown };
}

/**
 * Presents an absolute path relative to `root` when possible, for display purposes.
 */
export function displayPath(root: string, path: string): string {
	const rel = relative(root, path);
	if (!rel) return '.';
	return rel.startsWith('..') || isAbsolute(rel) ? path : rel;
}

function resolveEntry(root: string, configured: string | undefined, validator: Validator): string {
	if (configured !== undefined) {
		const entry = resolve(root, configured);
		if (!isFile(entry)) {
			throw validator.error(configDiagnostics.ENTRY_NOT_FOUND, { entry });
		}
		return entry;
	}

	for (const candidate of DEFAULT_ENTRIES) {
		const entry = join(root, candidate);
		if (isFile(entry)) return entry;
	}

	throw validator.error(configDiagnostics.ENTRY_DEFAULT_NOT_FOUND, { root, defaults: DEFAULT_ENTRIES.join(', ') });
}

function resolveBuild(
	root: string,
	entry: string,
	packageJson: PackageJsonLike | null,
	config: NonNullable<StarsConfig['build']>,
	experimental: ResolvedExperimentalConfig,
	future: ResolvedFutureConfig,
	hasTsdownOptions: boolean,
	validator: Validator
): ResolvedBuildConfig {
	validator.knownKeys(config, 'build', ['tool', 'outDir', 'tsconfig']);

	const requested = validator.string(config.tool, 'build.tool') ?? 'auto';
	if (!BUILD_TOOLS.has(requested)) {
		throw validator.error(configDiagnostics.INVALID_BUILD_TOOL, { tool: requested });
	}

	if (requested === 'vite' && !experimental.enableVite) {
		throw validator.error(configDiagnostics.EXPERIMENTAL_BUILD_TOOL, { tool: 'vite', flag: 'experimental.enableVite' });
	}

	const isTypeScriptEntry = TYPESCRIPT_EXTENSIONS.has(extname(entry));
	const tool: StarsBuildTool =
		requested === 'auto'
			? detectBuildTool(root, packageJson, isTypeScriptEntry, experimental, future, hasTsdownOptions)
			: (requested as StarsBuildTool);

	if (tool === 'none' && isTypeScriptEntry) {
		throw validator.error(configDiagnostics.BUILD_TOOL_REQUIRED, { entry: displayPath(root, entry) });
	}

	// Nitro owns its own output layout; anything else keeps the plain `dist` convention.
	const defaultOutDir = experimental.enableNitro ? '.output' : 'dist';
	const outDir = resolve(root, validator.string(config.outDir, 'build.outDir') ?? defaultOutDir);

	let tsconfig: string | null = null;
	const configuredTsconfig = validator.string(config.tsconfig, 'build.tsconfig');
	if (configuredTsconfig !== undefined) {
		tsconfig = resolve(root, configuredTsconfig);
		if (!isFile(tsconfig)) {
			throw validator.error(configDiagnostics.TSCONFIG_EXPLICIT_NOT_FOUND, { tsconfig, path: 'build.tsconfig' });
		}
	} else if (tool === 'tsc' || tool === 'tsdown') {
		// `tsdown` only looks for a `tsconfig.json` next to the project root, so a bot keeping its sources' one in
		// `src/` (the layout both the scaffold and the examples use) would silently build without its paths and
		// target. Resolving it here is what makes the `tsdown` build need no configuration of its own.
		tsconfig = [join(root, 'src', 'tsconfig.json'), join(root, 'tsconfig.json')].find((candidate) => isFile(candidate)) ?? null;
		if (!tsconfig && tool === 'tsc') {
			throw validator.error(configDiagnostics.TSCONFIG_NOT_FOUND, { root, suggestion: 'build.tsconfig' });
		}
	}

	// Nitro always writes its server entry to `<outDir>/server/index.mjs`, regardless of the project's own entry
	// file name or `package.json#main` — it is Nitro's output, not a build of the project's own entry file.
	const output = experimental.enableNitro
		? join(outDir, 'server', 'index.mjs')
		: tool === 'none'
			? entry
			: resolveBuildOutput(root, entry, outDir, packageJson);

	let configFile = findConfigFile(root, tool === 'tsdown' ? TSDOWN_CONFIG_FILES : tool === 'vite' ? VITE_CONFIG_FILES : []);
	// `tsdown` reads `package.json#tsdown` when no configuration file is around, so it counts as one here.
	if (tool === 'tsdown' && configFile === null && packageJson?.tsdown !== undefined) configFile = join(root, 'package.json');

	// Compatibility version 4 builds `tsdown` from this file alone. A `tsdown.config.*` left behind would keep the
	// plugins and entry points it declares out of the build, so it is reported rather than quietly ignored.
	if (tool === 'tsdown' && configFile !== null && future.compatibilityVersion >= LATEST_COMPATIBILITY_VERSION) {
		throw validator.error(configDiagnostics.TSDOWN_CONFIG_FILE_UNSUPPORTED, {
			file: displayPath(root, configFile),
			version: future.compatibilityVersion,
			legacyVersion: LEGACY_COMPATIBILITY_VERSION
		});
	}

	return { tool, outDir, tsconfig, output, configFile };
}

function findConfigFile(root: string, names: readonly string[]): string | null {
	for (const name of names) {
		const candidate = join(root, name);
		if (isFile(candidate)) return candidate;
	}

	return null;
}

function detectBuildTool(
	root: string,
	packageJson: PackageJsonLike | null,
	isTypeScriptEntry: boolean,
	experimental: ResolvedExperimentalConfig,
	future: ResolvedFutureConfig,
	hasTsdownOptions: boolean
): StarsBuildTool {
	// Vite only wins the detection once the project opted into it; without the flag a `vite.config.*` is somebody
	// else's (a dashboard, a docs site) and must not take the bot's build over.
	if (experimental.enableVite) {
		const hasVite = VITE_CONFIG_FILES.some((name) => isFile(join(root, name))) || hasDependency(packageJson, 'vite');
		if (hasVite) return 'vite';
	}

	if (hasTsdownOptions) return 'tsdown';

	// From compatibility version 4 on, `tsdown` is the build of a TypeScript project rather than one of the options:
	// there is no `tsdown.config.*` left to detect it from, and a missing dependency is reported by the builder with
	// an install hint instead of silently falling back to `tsc`.
	if (future.compatibilityVersion >= LATEST_COMPATIBILITY_VERSION) return isTypeScriptEntry ? 'tsdown' : 'none';

	const hasTsdown = TSDOWN_CONFIG_FILES.some((name) => isFile(join(root, name))) || hasDependency(packageJson, 'tsdown');
	if (hasTsdown) return 'tsdown';
	if (isTypeScriptEntry) return 'tsc';
	return 'none';
}

/**
 * Resolves the Nuxt-style compatibility block. Version 4 is the default; version 3 remains an explicit legacy mode.
 */
function resolveFuture(config: StarsFutureConfig, validator: Validator): ResolvedFutureConfig {
	if (config === null || typeof config !== 'object' || Array.isArray(config)) {
		throw validator.typeError('future', 'an object', config, 'Use `{ compatibilityVersion }`.');
	}

	validator.knownKeys(config, 'future', ['compatibilityVersion']);
	const version = config.compatibilityVersion;
	if (version === undefined) return { compatibilityVersion: DEFAULT_COMPATIBILITY_VERSION };

	if (typeof version !== 'number' || !COMPATIBILITY_VERSIONS.has(version)) {
		throw validator.error(configDiagnostics.INVALID_COMPATIBILITY_VERSION, {
			value: version,
			legacyVersion: LEGACY_COMPATIBILITY_VERSION,
			latestVersion: LATEST_COMPATIBILITY_VERSION
		});
	}

	return { compatibilityVersion: version as StarsCompatibilityVersion };
}

/**
 * Resolves the `experimental` block. Every flag is a boolean defaulting to `false`, the way Nuxt's own experimental
 * flags are declared, and the ones that build on each other are checked here rather than surfacing later as a
 * confusing runtime failure.
 */
function resolveExperimental(config: StarsExperimentalConfig, validator: Validator): ResolvedExperimentalConfig {
	if (config === null || typeof config !== 'object' || Array.isArray(config)) {
		throw validator.typeError('experimental', 'an object', config, 'Use `{ enableVite, enableExternalVite, enableNitro, nitro }`.');
	}

	validator.knownKeys(config, 'experimental', ['enableVite', 'enableExternalVite', 'enableNitro', 'nitro']);
	const enableVite = validator.boolean(config.enableVite, 'experimental.enableVite') ?? false;
	const enableExternalVite = validator.boolean(config.enableExternalVite, 'experimental.enableExternalVite') ?? false;
	const enableNitro = validator.boolean(config.enableNitro, 'experimental.enableNitro') ?? false;

	if (enableExternalVite && !enableVite) {
		throw validator.error(configDiagnostics.EXPERIMENT_REQUIRED, {
			path: 'experimental.enableExternalVite',
			requires: 'experimental.enableVite',
			drop: 'enableExternalVite'
		});
	}

	if (enableNitro && !enableVite) {
		throw validator.error(configDiagnostics.EXPERIMENT_REQUIRED, {
			path: 'experimental.enableNitro',
			requires: 'experimental.enableVite',
			drop: 'enableNitro'
		});
	}

	const rawNitro = 'nitro' in config ? config.nitro : undefined;
	if (rawNitro !== undefined && !enableNitro) {
		throw validator.error(configDiagnostics.EXPERIMENT_REQUIRED, {
			path: 'experimental.nitro',
			requires: 'experimental.enableNitro',
			drop: 'nitro'
		});
	}
	if (rawNitro !== undefined && (rawNitro === null || typeof rawNitro !== 'object' || Array.isArray(rawNitro))) {
		throw validator.typeError('experimental.nitro', 'an object', rawNitro, 'Use `{ preset }`.');
	}
	if (rawNitro) validator.knownKeys(rawNitro, 'experimental.nitro', ['preset']);
	const preset = validator.string(rawNitro?.preset, 'experimental.nitro.preset') ?? 'node-server';

	return { enableVite, enableExternalVite, enableNitro, nitro: { preset } };
}

function resolveBuildOutput(root: string, entry: string, outDir: string, packageJson: PackageJsonLike | null): string {
	if (packageJson?.main) return resolve(root, packageJson.main);

	const extension = extname(entry);
	const outputExtension = extension === '.mts' ? '.mjs' : extension === '.cts' ? '.cjs' : '.js';
	return join(outDir, `${basename(entry, extension)}${outputExtension}`);
}

const ENV_PORT_KEYS = ['HTTP_PORT', 'PORT'] as const;

/**
 * Reads the project's environment layers from `src/.env*` and `.env*` into a plain object, the way `stars dev` and
 * `stars commands` need it:
 * these files are only loaded into `process.env` by the bot itself once it starts (see `@wolfstar/env-utilities`),
 * so by the time the CLI runs they are not there yet. This is a minimal line reader, not a full dotenv
 * implementation — quoting is stripped, but expansion (`dotenv-expand`) is not. Earlier files win, matching
 * dotenv's own precedence.
 */
export function readProjectEnvFiles(root: string, environment = 'development'): Record<string, string> {
	const result: Record<string, string> = {};
	const suffixes = [`.${environment}.local`, ...(environment === 'test' ? [] : ['.local']), `.${environment}`, ''];
	const files = suffixes.flatMap((suffix) => [join('src', `.env${suffix}`), `.env${suffix}`]);

	for (const file of files) {
		const path = join(root, file);
		if (!isFile(path)) continue;

		let contents: string;
		try {
			contents = readFileSync(path, 'utf-8');
		} catch {
			continue;
		}

		for (const line of contents.split(/\r?\n/)) {
			const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
			if (!match) continue;

			const key = match[1]!;
			if (key in result) continue;
			result[key] = match[2]!.trim().replace(/^['"]|['"]$/g, '');
		}
	}

	return result;
}

function readDevPortFromEnvFile(root: string, environment: string): string | null {
	const values = readProjectEnvFiles(root, environment);
	for (const key of ENV_PORT_KEYS) {
		if (values[key]) return values[key];
	}

	return null;
}

function resolveDev(
	root: string,
	entry: string,
	packageJson: PackageJsonLike | null,
	config: NonNullable<StarsConfig['dev']>,
	env: NodeJS.ProcessEnv,
	validator: Validator
): ResolvedDevConfig {
	validator.knownKeys(config, 'dev', [
		'banner',
		'watch',
		'ignore',
		'debounce',
		'env',
		'nodeArgs',
		'args',
		'url',
		'health',
		'killTimeout',
		'typecheck',
		'tunnel',
		'logFile'
	]);

	const watch = (validator.stringArray(config.watch, 'dev.watch') ?? [displayPath(root, dirname(entry))]).map((path) => resolve(root, path));
	const ignore = validator.stringArray(config.ignore, 'dev.ignore') ?? [...DEFAULT_IGNORE];
	const debounce = validator.nonNegativeNumber(config.debounce, 'dev.debounce') ?? DEFAULT_DEBOUNCE;
	const devEnv = validator.stringRecord(config.env, 'dev.env') ?? {};
	const nodeArgs = validator.stringArray(config.nodeArgs, 'dev.nodeArgs') ?? [...DEFAULT_NODE_ARGS];
	const args = validator.stringArray(config.args, 'dev.args') ?? [];
	const killTimeout = validator.nonNegativeNumber(config.killTimeout, 'dev.killTimeout') ?? DEFAULT_KILL_TIMEOUT;
	const health = validator.string(config.health, 'dev.health') ?? null;

	let url = validator.string(config.url, 'dev.url') ?? null;
	if (url !== null) {
		try {
			new URL(url);
		} catch {
			throw validator.error(configDiagnostics.INVALID_URL, { url, fix: 'Use an absolute URL such as http://localhost:3000.' });
		}
	} else {
		// Mirrors Vite's and Nuxt's own dev servers: a URL is shown without any configuration. The exact host
		// (`localhost` vs `127.0.0.1`) is resolved at runtime by `stars dev`, once it knows which one is actually reachable.
		const port = devEnv.HTTP_PORT ?? env.HTTP_PORT ?? readDevPortFromEnvFile(root, env.NODE_ENV ?? 'development') ?? String(DEFAULT_DEV_PORT);
		url = /^\d+$/.test(port) ? `http://localhost:${port}` : `http://localhost:${DEFAULT_DEV_PORT}`;
	}

	const typecheck = resolveTypecheck(root, packageJson, config.typecheck, validator);
	const tunnel = resolveTunnel(config.tunnel, validator);
	const logFile = config.logFile === false ? null : resolve(root, validator.string(config.logFile, 'dev.logFile') ?? DEFAULT_DEV_LOG_FILE);
	const banner =
		config.banner === false
			? false
			: typeof config.banner === 'string'
				? config.banner.split('\n')
				: (validator.stringArray(config.banner, 'dev.banner') ?? null);

	return { watch, ignore, debounce, env: devEnv, nodeArgs, args, url, health, killTimeout, typecheck, tunnel, logFile, banner };
}

/**
 * Resolves `dev.typecheck`. The tsconfig is looked up the same way the `tsc` build tool looks up its own, so a
 * project building with `tsdown` still gets `tsc --watch --noEmit` on the right project file.
 */
function resolveTypecheck(
	root: string,
	packageJson: PackageJsonLike | null,
	config: StarsDevConfig['typecheck'],
	validator: Validator
): ResolvedTypecheckConfig {
	if (config === undefined || config === false) return { enabled: false, tsconfig: null, checker: detectTypechecker(packageJson) };

	let configured: string | undefined;
	let requestedChecker = 'auto';
	if (config !== true) {
		if (config === null || typeof config !== 'object' || Array.isArray(config)) {
			throw validator.typeError(
				'dev.typecheck',
				'a boolean or an object',
				config,
				'Use `true` to type-check with the project tsconfig, `{ tsconfig }` to pick one, or `false` to disable it.'
			);
		}

		validator.knownKeys(config, 'dev.typecheck', ['tsconfig', 'checker']);
		configured = validator.string(config.tsconfig, 'dev.typecheck.tsconfig');
		requestedChecker = validator.string(config.checker, 'dev.typecheck.checker') ?? 'auto';
		if (!TYPECHECKERS.has(requestedChecker)) {
			throw validator.error(configDiagnostics.INVALID_TYPECHECKER, { checker: requestedChecker });
		}
	}

	const checker: StarsTypechecker = requestedChecker === 'auto' ? detectTypechecker(packageJson) : (requestedChecker as StarsTypechecker);

	if (configured !== undefined) {
		const tsconfig = resolve(root, configured);
		if (!isFile(tsconfig)) {
			throw validator.error(configDiagnostics.TSCONFIG_EXPLICIT_NOT_FOUND, { tsconfig, path: 'dev.typecheck.tsconfig' });
		}
		return { enabled: true, tsconfig, checker };
	}

	const found = [join(root, 'src', 'tsconfig.json'), join(root, 'tsconfig.json')].find((candidate) => isFile(candidate)) ?? null;
	if (!found) {
		throw validator.error(configDiagnostics.TSCONFIG_NOT_FOUND, { root, suggestion: 'dev.typecheck.tsconfig' });
	}

	return { enabled: true, tsconfig: found, checker };
}

/**
 * Picks the type checker when `dev.typecheck.checker` is `auto`: `golar` when the project already depends on it
 * (it wraps TypeScript and is what this repository's own `typecheck` scripts run), `tsc` otherwise. `tsz` is never
 * picked automatically — it is an early, tsc-compatible alternative a project opts into.
 */
function detectTypechecker(packageJson: PackageJsonLike | null): StarsTypechecker {
	return hasDependency(packageJson, 'golar') ? 'golar' : 'tsc';
}

/**
 * Resolves `dev.tunnel`: `true` (or `{}`) opens a `cloudflared` quick tunnel, a string (or `{ url }`) is an https
 * URL the user already serves and the CLI only checks.
 */
function resolveTunnel(config: StarsDevConfig['tunnel'], validator: Validator): ResolvedTunnelConfig {
	if (config === undefined || config === false) return { mode: 'off' };

	let url: string | undefined;
	let updateEndpoint = false;
	let path = DEFAULT_TUNNEL_PATH;

	if (typeof config === 'string') {
		url = config;
	} else if (config !== true) {
		if (config === null || typeof config !== 'object' || Array.isArray(config)) {
			throw validator.typeError(
				'dev.tunnel',
				'a boolean, an https URL or an object',
				config,
				'Use `true` for a cloudflared quick tunnel, an https URL you already serve, or `false` to disable it.'
			);
		}

		validator.knownKeys(config, 'dev.tunnel', ['url', 'updateEndpoint', 'path']);
		url = validator.string(config.url, 'dev.tunnel.url');
		updateEndpoint = validator.boolean(config.updateEndpoint, 'dev.tunnel.updateEndpoint') ?? false;
		path = validator.string(config.path, 'dev.tunnel.path') ?? DEFAULT_TUNNEL_PATH;
	}

	if (url === undefined) return { mode: 'quick', path, updateEndpoint };

	// Discord only accepts an https interactions endpoint.
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw validator.error(configDiagnostics.INVALID_URL, { url, fix: 'Use an absolute https URL such as https://bot.example.com.' });
	}

	if (parsed.protocol !== 'https:') {
		throw validator.error(configDiagnostics.TUNNEL_URL_NOT_HTTPS, { url });
	}

	return { mode: 'url', url, path, updateEndpoint };
}

function resolveCodegen(root: string, config: NonNullable<StarsConfig['codegen']>, validator: Validator): ResolvedCodegenConfig {
	validator.knownKeys(config, 'codegen', ['i18n']);

	if (config.i18n === false) return { i18n: null };

	if (config.i18n === undefined) {
		const locales = join(root, DEFAULT_I18N_LOCALES);
		return { i18n: isDirectory(locales) ? { locales, output: join(root, DEFAULT_I18N_OUTPUT) } : null };
	}

	if (config.i18n === null || typeof config.i18n !== 'object') {
		throw validator.typeError(
			'codegen.i18n',
			'an object or `false`',
			config.i18n,
			'Use `{ locales, output }` to configure it or `false` to disable it.'
		);
	}

	validator.knownKeys(config.i18n, 'codegen.i18n', ['locales', 'output']);
	const locales = resolve(root, validator.string(config.i18n.locales, 'codegen.i18n.locales') ?? DEFAULT_I18N_LOCALES);
	if (!isDirectory(locales)) {
		throw validator.error(configDiagnostics.LOCALES_NOT_FOUND, { locales });
	}

	const output = resolve(root, validator.string(config.i18n.output, 'codegen.i18n.output') ?? DEFAULT_I18N_OUTPUT);
	return { i18n: { locales, output } };
}

/**
 * The transform that injects auto imports (`@wolfstar/http-framework/auto-imports`) only runs through `tsdown`'s
 * rolldown pipeline, the same way Nuxt's own auto imports only run through its Vite/webpack build: `tsc` and `none`
 * have no transform step to hook into. `tsdown` is picked as `build.tool` first (see {@link detectBuildTool}) for the
 * same reason — it is the only tool this feature, and this build config in general, treats as the default choice.
 *
 * They are on by default from compatibility version 4 on, where `stars` wires the plugin into the build itself. At 3
 * the plugin is the project's to add, so defaulting them on would promise imports that never get injected.
 */
function resolveImports(
	root: string,
	buildTool: StarsBuildTool,
	future: ResolvedFutureConfig,
	config: StarsConfig['imports'],
	validator: Validator
): ResolvedImportsConfig {
	const defaultDirs = DEFAULT_IMPORTS_DIRS.map((dir) => resolve(root, dir));
	const defaultPresets = [...DEFAULT_IMPORTS_PRESETS];
	const defaultDts = resolve(root, DEFAULT_IMPORTS_DTS);

	if (config === false) {
		return { enabled: false, dirs: defaultDirs, presets: defaultPresets, exclude: [], dts: defaultDts };
	}

	const forcedOn = config === true;
	const options = forcedOn || config === undefined ? {} : config;
	if (typeof options !== 'object' || options === null || Array.isArray(options)) {
		throw validator.typeError(
			'imports',
			'an object, `true` or `false`',
			options,
			'Use `{ dirs, presets, exclude, dts }`, `true` to enable with defaults, or `false` to disable.'
		);
	}

	validator.knownKeys(options, 'imports', ['enabled', 'dirs', 'presets', 'exclude', 'dts']);

	const requestedOn = forcedOn || validator.boolean(options.enabled, 'imports.enabled');
	if (requestedOn && buildTool !== 'tsdown') {
		throw validator.error(configDiagnostics.IMPORTS_REQUIRE_TSDOWN, {});
	}

	const dirs = (validator.stringArray(options.dirs, 'imports.dirs') ?? [...DEFAULT_IMPORTS_DIRS]).map((dir) => resolve(root, dir));
	const presets = validator.stringArray(options.presets, 'imports.presets') ?? defaultPresets;
	const exclude = validator.stringArray(options.exclude, 'imports.exclude') ?? [];
	const dts = resolve(root, validator.string(options.dts, 'imports.dts') ?? DEFAULT_IMPORTS_DTS);

	const enabledByDefault = buildTool === 'tsdown' && future.compatibilityVersion >= LATEST_COMPATIBILITY_VERSION;
	return { enabled: requestedOn ?? enabledByDefault, dirs, presets, exclude, dts };
}

class Validator {
	public constructor(private readonly file: string | null) {}

	private get sources(): string[] | undefined {
		return this.file ? [this.file] : undefined;
	}

	public error<Handle extends (params: any) => Diagnostic>(handle: Handle, params: Parameters<Handle>[0]): Diagnostic {
		return handle({ ...params, sources: this.sources });
	}

	public knownKeys(value: object, path: string, keys: readonly string[]): void {
		for (const key of Object.keys(value)) {
			if (keys.includes(key)) continue;
			const fullPath = path ? `${path}.${key}` : key;
			throw this.error(configDiagnostics.UNKNOWN_OPTION, { path: fullPath, parent: path, known: keys.join(', ') });
		}
	}

	public string(value: unknown, path: string): string | undefined {
		if (value === undefined) return undefined;
		if (typeof value !== 'string' || value.length === 0) throw this.typeError(path, 'a non-empty string', value);
		return value;
	}

	public boolean(value: unknown, path: string): boolean | undefined {
		if (value === undefined) return undefined;
		if (typeof value !== 'boolean') throw this.typeError(path, 'a boolean', value);
		return value;
	}

	/** A plain object passed through as-is (e.g. raw `vite`/`tsdown` config merged into the project's own). */
	public plainObject(value: unknown, path: string): Record<string, unknown> | undefined {
		if (value === undefined) return undefined;
		if (value === null || typeof value !== 'object' || Array.isArray(value)) throw this.typeError(path, 'an object', value);
		return value as Record<string, unknown>;
	}

	public stringArray(value: unknown, path: string): string[] | undefined {
		if (value === undefined) return undefined;
		if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) throw this.typeError(path, 'an array of strings', value);
		return value;
	}

	public nonNegativeNumber(value: unknown, path: string): number | undefined {
		if (value === undefined) return undefined;
		if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw this.typeError(path, 'a non-negative number', value);
		return value;
	}

	public stringRecord(value: unknown, path: string): Record<string, string> | undefined {
		if (value === undefined) return undefined;
		if (value === null || typeof value !== 'object' || Array.isArray(value) || !Object.values(value).every((item) => typeof item === 'string')) {
			throw this.typeError(path, 'an object of string values', value);
		}
		return value as Record<string, string>;
	}

	/** A generic "wrong type" diagnostic. `fix` defaults to the standard "set it or remove it" wording. */
	public typeError(path: string, expected: string, value: unknown, fix?: string): Diagnostic {
		return this.error(configDiagnostics.INVALID_TYPE, {
			path,
			expected,
			value,
			fix: fix ?? `Set \`${path}\` to ${expected} or remove it to use the default.`
		});
	}
}

function hasDependency(packageJson: PackageJsonLike | null, name: string): boolean {
	return Boolean(packageJson?.dependencies?.[name] ?? packageJson?.devDependencies?.[name]);
}

function readPackageJson(root: string, validator: Validator): PackageJsonLike | null {
	const file = join(root, 'package.json');
	if (!isFile(file)) return null;

	try {
		const parsed: unknown = JSON.parse(readFileSync(file, 'utf-8'));
		return parsed !== null && typeof parsed === 'object' ? (parsed as PackageJsonLike) : null;
	} catch (error) {
		throw validator.error(configDiagnostics.PACKAGE_JSON_INVALID, {
			file,
			message: error instanceof Error ? error.message : String(error),
			cause: error
		});
	}
}

function isFile(path: string): boolean {
	try {
		return existsSync(path) && statSync(path).isFile();
	} catch {
		return false;
	}
}

function isDirectory(path: string): boolean {
	try {
		return existsSync(path) && statSync(path).isDirectory();
	} catch {
		return false;
	}
}
