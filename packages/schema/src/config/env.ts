import type { StarsConfig, StarsEnvSetupOptions } from '../types/config.js';
import { AUTO_ENV_VERSION, type ResolvedFutureConfig } from './compatibility.js';
import { configDiagnostics } from './errors.js';
import { hasDependency, type PackageJsonLike, type ResolvedExperimentalConfig } from './resolve.js';
import type { Validator } from './validator.js';

export interface ResolvedEnvConfig {
	/** Whether the built entry registers the environment before any other module. */
	readonly enabled: boolean;
	/** The options handed to `setup()` from `@wolfstar/env-utilities`, as written by the user. */
	readonly options: Readonly<StarsEnvSetupOptions>;
}

const ENV_UTILITIES = '@wolfstar/env-utilities';
const LOADERS = new Set(['dotenv', 'varlock']);

/**
 * Resolves the `env` block. It is on by default from {@link AUTO_ENV_VERSION} on, but only when the project depends on
 * `@wolfstar/env-utilities` (the module the built entry imports) and does not build through Nitro, whose serverless
 * presets have no `.env` files to load. `true`, `enabled: true` or any option at all is an explicit opt-in, which
 * does require the dependency.
 */
export function resolveEnv(
	config: StarsConfig['env'],
	packageJson: PackageJsonLike | null,
	future: ResolvedFutureConfig,
	experimental: ResolvedExperimentalConfig,
	validator: Validator
): ResolvedEnvConfig {
	if (config === false) return { enabled: false, options: {} };

	const forcedOn = config === true;
	const raw = forcedOn || config === undefined ? {} : config;
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
		throw validator.typeError(
			'env',
			'an object, `true` or `false`',
			raw,
			'Use `{ path, env, prefix, loader, debug, encoding }`, `true` to enable with defaults, or `false` to disable.'
		);
	}

	validator.knownKeys(raw, 'env', ['enabled', 'path', 'env', 'prefix', 'loader', 'debug', 'encoding']);

	const options: StarsEnvSetupOptions = {};
	const path = validator.string(raw.path, 'env.path');
	if (path !== undefined) options.path = path;
	const env = validator.string(raw.env, 'env.env');
	if (env !== undefined) options.env = env;
	const prefix = validator.string(raw.prefix, 'env.prefix');
	if (prefix !== undefined) options.prefix = prefix;
	const loader = validator.string(raw.loader, 'env.loader');
	if (loader !== undefined) {
		if (!LOADERS.has(loader)) throw validator.typeError('env.loader', "'dotenv' or 'varlock'", loader, "Use 'dotenv' (default) or 'varlock'.");
		options.loader = loader as NonNullable<StarsEnvSetupOptions['loader']>;
	}
	const debug = validator.boolean(raw.debug, 'env.debug');
	if (debug !== undefined) options.debug = debug;
	const encoding = validator.string(raw.encoding, 'env.encoding');
	if (encoding !== undefined) options.encoding = encoding;

	const enabled = validator.boolean(raw.enabled, 'env.enabled');
	if (enabled === false) return { enabled: false, options };

	const installed = hasDependency(packageJson, ENV_UTILITIES);
	const explicit = forcedOn || enabled === true || Object.keys(options).length > 0;
	if (explicit && !installed) throw validator.error(configDiagnostics.ENV_REQUIRES_ENV_UTILITIES, {});

	const enabledByDefault = installed && future.compatibilityVersion >= AUTO_ENV_VERSION && !experimental.enableNitro;
	return { enabled: explicit || enabledByDefault, options };
}
