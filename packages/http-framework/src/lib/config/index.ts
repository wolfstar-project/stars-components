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
 * @throws {ConfigError} when the configuration file cannot be loaded or contains an invalid option.
 */
export async function loadStarsConfig(options: LoadStarsConfigOptions = {}): Promise<ResolvedStarsConfig> {
	const cwd = options.cwd ?? process.cwd();
	const loaded = await loadConfigFile({ cwd, configFile: options.configFile });
	return resolveStarsConfig({ cwd, configFile: loaded.configFile, config: loaded.config, env: options.env });
}

export { CONFIG_EXTENSIONS, CONFIG_FILE_NAMES, discoverConfigFile, loadConfigFile } from './load.js';
export type { LoadConfigFileOptions, LoadedConfigFile } from './load.js';
export { ConfigError } from './errors.js';
export type { ConfigErrorOptions } from './errors.js';
export { displayPath, readProjectEnvFiles, resolveStarsConfig } from './resolve.js';
export type {
	PackageJsonLike,
	ResolveConfigOptions,
	ResolvedBuildConfig,
	ResolvedCodegenConfig,
	ResolvedDevConfig,
	ResolvedExperimentalConfig,
	ResolvedI18nCodegenConfig,
	ResolvedImportsConfig,
	ResolvedStarsConfig,
	ResolvedTunnelConfig,
	ResolvedTypecheckConfig
} from './resolve.js';
