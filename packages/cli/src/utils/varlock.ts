import { detectVarlock, type ResolvedStarsConfig, type VarlockDetection } from '@wolfstar/schema';
import type { Diagnostic } from 'nostics';
import { cliDiagnostics } from './diagnostics.js';

/** What the project's varlock setup says about `stars.config`, when something is worth saying. */
export type VarlockFinding =
	/** A schema and an installed varlock are there and the bot loads through varlock, but `stars.config` does not say so. */
	| { kind: 'implicit'; detection: VarlockDetection }
	/** A schema is there but varlock cannot be resolved (not installed, or only listed), so the bot falls back to the dotenv files. */
	| { kind: 'not-installed'; detection: VarlockDetection }
	/** A schema is there, but `env.loader` asks for another loader. */
	| { kind: 'mismatch'; detection: VarlockDetection; loader: 'node' | 'dotenv' }
	/** `env.loader` is `'varlock'`, but the package cannot be resolved. */
	| { kind: 'missing-package'; detection: VarlockDetection };

/**
 * Compares the project's varlock setup with its `stars.config`. The runtime only picks varlock by itself when no
 * `env.path` is set, which is why a project with one is not looked at unless it asks for varlock explicitly.
 */
export function inspectVarlock(config: ResolvedStarsConfig): VarlockFinding | null {
	if (!config.env.enabled) return null;

	const detection = detectVarlock(config.root);
	const { loader, path } = config.env.options;
	if (loader === 'varlock') return detection.installed ? null : { kind: 'missing-package', detection };
	if (detection.schema === null) return null;
	if (loader !== undefined) return { kind: 'mismatch', detection, loader };
	if (path !== undefined) return null;

	// A dependency in `package.json` does not make varlock resolvable: the runtime only picks it once it is installed.
	return detection.installed ? { kind: 'implicit', detection } : { kind: 'not-installed', detection };
}

/** The non-fatal reports `stars prepare`, `build`, `dev` and `info` print: the ones the user can act on right away. */
export function varlockWarning(config: ResolvedStarsConfig): Diagnostic | null {
	const finding = inspectVarlock(config);
	if (finding?.kind === 'implicit') return cliDiagnostics.VARLOCK_LOADER_IMPLICIT({});
	if (finding?.kind === 'not-installed') return cliDiagnostics.VARLOCK_NOT_INSTALLED({});
	return null;
}
