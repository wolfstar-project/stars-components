import { loadConfigFile } from './load.js';
import { resolveStarsConfig, type ResolvedStarsConfig } from './resolve.js';

export interface LoadStarsConfigOptions {
	/**
	 * The directory to discover `stars.config.*` from.
	 * @default process.cwd()
	 */
	cwd?: string;
	/** An explicit configuration file, resolved from `cwd`. */
	configFile?: string | null;
	/**
	 * Environment used for defaults such as `HTTP_PORT`.
	 * @default process.env
	 */
	env?: NodeJS.ProcessEnv;
}

/**
 * Loads, validates and resolves a project's `stars.config.*`.
 *
 * @throws {Diagnostic} (from `nostics`, via {@link configDiagnostics}) when the configuration file cannot be loaded or contains an invalid option.
 */
export async function loadStarsConfig(options: LoadStarsConfigOptions = {}): Promise<ResolvedStarsConfig> {
	const cwd = options.cwd ?? process.cwd();
	const loaded = await loadConfigFile({ cwd, configFile: options.configFile });
	return resolveStarsConfig({ cwd, configFile: loaded.configFile, config: loaded.config, env: options.env });
}

export { CONFIG_EXTENSIONS, CONFIG_FILE_NAMES, discoverConfigFile, loadConfigFile } from './load.js';
export type { LoadConfigFileOptions, LoadedConfigFile } from './load.js';
export {
	AUTO_ENV_VERSION,
	AUTO_VARLOCK_VERSION,
	DEFAULT_COMPATIBILITY_VERSION,
	EOL_COMPATIBILITY_VERSIONS,
	LATEST_COMPATIBILITY_VERSION,
	LEGACY_COMPATIBILITY_VERSION,
	SPLIT_TSCONFIG_VERSION,
	STARS_CONFIG_TSDOWN_VERSION
} from './compatibility.js';
export { resolveEnv } from './env.js';
export type { ResolvedEnvConfig } from './env.js';
export { configDiagnostics } from './errors.js';
export { detectVarlock } from './varlock.js';
export type { VarlockDetection, VarlockSchema, VarlockSchemaSource } from './varlock.js';
export { resolveHooks, STARS_HOOK_NAMES } from './hooks.js';
export type { ResolvedHooksConfig } from './hooks.js';
export type { ConfigDiagnosticCode } from './errors.js';
export { BUILT_IN_CONFIG_KEYS, assertModuleOptionsClaimed } from './module-options.js';
export { resolveModules } from './modules.js';
export {
	DEFAULT_APP_TSCONFIG,
	DEFAULT_LOG_LEVELS,
	DEFAULT_NODE_TSCONFIG,
	DEFAULT_TUNNEL_PROVIDER,
	LOG_LEVELS,
	TUNNEL_PROVIDERS,
	displayPath,
	readProjectEnvFiles,
	resolveStarsConfig
} from './resolve.js';
export type {
	PackageJsonLike,
	ResolveConfigOptions,
	ResolvedBuildConfig,
	ResolvedCodegenConfig,
	ResolvedCommandsCodegenConfig,
	ResolvedDevCommandsConfig,
	ResolvedDevConfig,
	ResolvedDevLogsConfig,
	ResolvedExperimentalConfig,
	ResolvedFutureConfig,
	ResolvedNitroConfig,
	ResolvedI18nCodegenConfig,
	ResolvedImportsConfig,
	ResolvedStarsConfig,
	ResolvedTunnelConfig,
	ResolvedTypecheckConfig
} from './resolve.js';
