import type { Diagnostic } from 'nostics';
import type { StarsCompatibilityVersion, StarsFutureConfig } from '../types/config.js';
import { configDiagnostics } from './errors.js';
import type { Validator } from './validator.js';

export interface ResolvedFutureConfig {
	readonly compatibilityVersion: StarsCompatibilityVersion;
}

export const LEGACY_COMPATIBILITY_VERSION = 3;
export const LATEST_COMPATIBILITY_VERSION = 5;
export const DEFAULT_COMPATIBILITY_VERSION = LATEST_COMPATIBILITY_VERSION;
/** Versions still accepted but scheduled for removal in the next major. */
export const EOL_COMPATIBILITY_VERSIONS: ReadonlySet<number> = new Set([LEGACY_COMPATIBILITY_VERSION]);
/** From this version on, `tsdown` is configured from `stars.config` alone and auto imports are on by default. */
export const STARS_CONFIG_TSDOWN_VERSION = 4;
/** From this version on, `env` is registered automatically in the built entry. */
export const AUTO_ENV_VERSION = 5;

const COMPATIBILITY_VERSIONS = new Set<number>([LEGACY_COMPATIBILITY_VERSION, STARS_CONFIG_TSDOWN_VERSION, AUTO_ENV_VERSION]);

/**
 * Resolves the Nuxt-style compatibility block. Version 5 is the default and version 4 remains supported. Version 3 is
 * end-of-life: it still resolves, with a warning pushed to `warnings`, and is removed in the next major.
 *
 * New behaviour is gated by a named version constant (such as {@link AUTO_ENV_VERSION}), never by
 * {@link LATEST_COMPATIBILITY_VERSION}: bumping the latest version must not move older versions onto other defaults.
 */
export function resolveFuture(config: StarsFutureConfig, validator: Validator, warnings: Diagnostic[]): ResolvedFutureConfig {
	if (config === null || typeof config !== 'object' || Array.isArray(config)) {
		throw validator.typeError('future', 'an object', config, 'Use `{ compatibilityVersion }`.');
	}

	validator.knownKeys(config, 'future', ['compatibilityVersion']);
	const version = config.compatibilityVersion;
	if (version === undefined) return { compatibilityVersion: DEFAULT_COMPATIBILITY_VERSION };

	if (typeof version !== 'number' || !COMPATIBILITY_VERSIONS.has(version)) {
		throw validator.error(configDiagnostics.INVALID_COMPATIBILITY_VERSION, {
			value: version,
			supported: [...COMPATIBILITY_VERSIONS].join(', '),
			latestVersion: LATEST_COMPATIBILITY_VERSION
		});
	}

	if (EOL_COMPATIBILITY_VERSIONS.has(version)) {
		warnings.push(validator.error(configDiagnostics.COMPATIBILITY_VERSION_EOL, { version, latestVersion: LATEST_COMPATIBILITY_VERSION }));
	}

	return { compatibilityVersion: version as StarsCompatibilityVersion };
}
