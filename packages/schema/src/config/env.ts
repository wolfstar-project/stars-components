import type { StarsConfig, StarsEnvSetupOptions } from '../types/config.js';
import { AUTO_ENV_VERSION, AUTO_VARLOCK_VERSION, type ResolvedFutureConfig } from './compatibility.js';
import { configDiagnostics } from './errors.js';
import { hasDependency, type PackageJsonLike, type ResolvedExperimentalConfig } from './resolve.js';
import type { Validator } from './validator.js';
import { detectVarlock } from './varlock.js';

export interface ResolvedEnvConfig {
	/** Whether the built entry registers the environment before any other module. */
	readonly enabled: boolean;
	/** The options handed to `setup()` from `@wolfstar/env-utilities`, as written by the user. */
	readonly options: Readonly<StarsEnvSetupOptions>;
	/**
	 * The loader the bot will use, as far as the CLI can tell: `options.loader` when it is set, otherwise `'varlock'`
	 * when `@wolfstar/env-utilities` would pick it by itself (see {@link AUTO_VARLOCK_VERSION}). `undefined` leaves the
	 * choice between `dotenv` and `node` to the runtime. `options` stays what the user wrote.
	 */
	readonly loader: StarsEnvSetupOptions['loader'] | undefined;
}

const ENV_UTILITIES = '@wolfstar/env-utilities';
const LOADERS = new Set(['node', 'dotenv', 'varlock']);

/**
 * Resolves the `env` block. It is on by default from {@link AUTO_ENV_VERSION} on, but only when the project depends on
 * `@wolfstar/env-utilities` (the module the built entry imports) and does not build through Nitro, whose serverless
 * presets have no `.env` files to load. `true`, `enabled: true` or any option at all is an explicit opt-in, which
 * does require the dependency.
 *
 * Without a `root` the project is not inspected, so no loader is detected.
 */
export function resolveEnv(
	config: StarsConfig['env'],
	packageJson: PackageJsonLike | null,
	future: ResolvedFutureConfig,
	experimental: ResolvedExperimentalConfig,
	validator: Validator,
	root?: string
): ResolvedEnvConfig {
	if (config === false) return { enabled: false, options: {}, loader: undefined };

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
		if (!LOADERS.has(loader))
			throw validator.typeError(
				'env.loader',
				"'node', 'dotenv' or 'varlock'",
				loader,
				"Use 'node', 'dotenv' or 'varlock', or leave it out to have it detected."
			);
		options.loader = loader as NonNullable<StarsEnvSetupOptions['loader']>;
	}
	const debug = validator.boolean(raw.debug, 'env.debug');
	if (debug !== undefined) options.debug = debug;
	const encoding = validator.string(raw.encoding, 'env.encoding');
	if (encoding !== undefined) options.encoding = encoding;

	const enabled = validator.boolean(raw.enabled, 'env.enabled');
	if (enabled === false) return { enabled: false, options, loader: options.loader };

	const installed = hasDependency(packageJson, ENV_UTILITIES);
	const explicit = forcedOn || enabled === true || Object.keys(options).length > 0;
	if (explicit && !installed) throw validator.error(configDiagnostics.ENV_REQUIRES_ENV_UTILITIES, {});

	const enabledByDefault = installed && future.compatibilityVersion >= AUTO_ENV_VERSION && !experimental.enableNitro;
	const enabledNow = explicit || enabledByDefault;
	return { enabled: enabledNow, options, loader: options.loader ?? (enabledNow ? detectImplicitLoader(root, options, future) : undefined) };
}

/** The runtime's `detectLoader`, for the one loader the CLI has to know about ahead of time. */
function detectImplicitLoader(root: string | undefined, options: StarsEnvSetupOptions, future: ResolvedFutureConfig): 'varlock' | undefined {
	if (root === undefined || options.path !== undefined || future.compatibilityVersion < AUTO_VARLOCK_VERSION) return undefined;
	const { schema, installed } = detectVarlock(root);
	return schema !== null && installed ? 'varlock' : undefined;
}
