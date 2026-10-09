import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ExistingVarlock {
	/** A `.env.schema` varlock (and `@wolfstar/env-utilities`) would find: `src/`, the project root or `varlock.loadPath`. */
	schema: boolean;
	/** `varlock` is in the `dependencies` or `devDependencies` of the `package.json`. */
	dependency: boolean;
}

interface PackageJsonLike {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	varlock?: { loadPath?: unknown };
}

function readPackageJson(directory: string): PackageJsonLike {
	try {
		const parsed: unknown = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf-8'));
		return parsed !== null && typeof parsed === 'object' ? (parsed as PackageJsonLike) : {};
	} catch {
		// No readable `package.json`: nothing to read a dependency or a `varlock.loadPath` from.
		return {};
	}
}

/**
 * Looks for varlock in a directory that already has a project (`--ignore`), so the generated `stars.config` can say
 * `env: { loader: 'varlock' }` instead of dropping what the project already uses. The schema lookup mirrors
 * `detectVarlock` of `@wolfstar/schema` (`tests/varlock.test.ts` runs both over the same fixtures); the scaffold
 * does not depend on that package.
 */
export function detectExistingVarlock(directory: string): ExistingVarlock {
	const packageJson = readPackageJson(directory);
	return {
		schema:
			existsSync(join(directory, 'src', '.env.schema')) || existsSync(join(directory, '.env.schema')) || Boolean(packageJson.varlock?.loadPath),
		dependency: Boolean(packageJson.dependencies?.varlock ?? packageJson.devDependencies?.varlock)
	};
}
