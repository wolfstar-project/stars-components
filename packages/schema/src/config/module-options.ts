import type { StarsConfig } from '../types/config.js';
import { configDiagnostics } from './errors.js';
import type { ResolvedStarsConfig } from './resolve.js';
import { Validator } from './validator.js';

/**
 * The top-level keys of `stars.config` the schema owns. Any other key is kept aside as a module's options (see
 * `ResolvedStarsConfig.moduleOptions`), so a module cannot claim one of these as its `meta.configKey`. Keep it equal
 * to the keys of `StarsConfig`: `module-config.test-d.ts` fails when they drift.
 */
export const BUILT_IN_CONFIG_KEYS = [
	'root',
	'entry',
	'build',
	'dev',
	'codegen',
	'imports',
	'env',
	'hooks',
	'modules',
	'experimental',
	'future',
	'vite',
	'tsdown'
] as const;

/** The keys of `config` the schema does not own, as written. A key set to `undefined` counts as absent. */
export function pickModuleOptions(config: StarsConfig): Readonly<Record<string, unknown>> {
	const builtIn: readonly string[] = BUILT_IN_CONFIG_KEYS;
	const options: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(config)) {
		if (value !== undefined && !builtIn.includes(key)) options[key] = value;
	}

	return Object.freeze(options);
}

/**
 * Reports the first top-level `stars.config` key that is neither built in nor claimed by an installed module (its
 * `meta.configKey`), the way the schema reports any other unknown option. It runs once the modules were set up, since
 * only then are the claimed keys known: a misspelled key is still an error, just a later one.
 *
 * @throws {Diagnostic} `UNKNOWN_OPTION`, listing the built-in and the claimed keys.
 */
export function assertModuleOptionsClaimed(config: Pick<ResolvedStarsConfig, 'configFile' | 'moduleOptions'>, claimed: readonly string[]): void {
	const known = [...BUILT_IN_CONFIG_KEYS, ...claimed];
	for (const key of Object.keys(config.moduleOptions)) {
		if (claimed.includes(key)) continue;
		throw new Validator(config.configFile).error(configDiagnostics.UNKNOWN_OPTION, {
			path: key,
			parent: '',
			known: known.join(', '),
			hint: `If \`${key}\` is the option of a module, check that the module is listed in \`modules\` and declares it as its \`configKey\`.`
		});
	}
}
