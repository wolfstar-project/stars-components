import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

/** Where a varlock schema was found, in the order `@wolfstar/env-utilities` looks. */
export type VarlockSchemaSource = 'src' | 'root' | 'loadPath';

export interface VarlockSchema {
	/** Which lookup rule matched. */
	readonly source: VarlockSchemaSource;
	/** The directory handed to `varlock load --path`; left out when varlock finds the schema on its own. */
	readonly path?: string;
}

export interface VarlockDetection {
	/** The project's varlock schema, or `null` when it has none. */
	readonly schema: VarlockSchema | null;
	/** Whether `varlock` can be resolved from the project (the runtime needs `varlock/exec-sync-varlock`). */
	readonly installed: boolean;
	/** Whether `varlock` is listed in the project's `dependencies` or `devDependencies`. */
	readonly dependency: boolean;
}

interface VarlockPackageJson {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	varlock?: { loadPath?: unknown };
}

/**
 * Detects varlock in the project at `root`. The schema lookup mirrors `findVarlockSchema` in
 * `@wolfstar/env-utilities` (`src/.env.schema`, then `.env.schema` at the root, then `varlock.loadPath` in
 * `package.json`), except that it starts from `root` instead of `process.cwd()`: the CLI can run from a parent
 * directory. `packages/schema/tests/config/varlock.test.ts` runs both over the same fixtures so the two cannot drift.
 */
export function detectVarlock(root: string): VarlockDetection {
	const packageJson = readVarlockPackageJson(root);
	return {
		schema: findVarlockSchema(root, packageJson),
		installed: isVarlockInstalled(root),
		dependency: Boolean(packageJson?.dependencies?.varlock ?? packageJson?.devDependencies?.varlock)
	};
}

function findVarlockSchema(root: string, packageJson: VarlockPackageJson | null): VarlockSchema | null {
	const src = join(root, 'src');
	if (existsSync(join(src, '.env.schema'))) return { source: 'src', path: src };
	if (existsSync(join(root, '.env.schema'))) return { source: 'root' };
	if (packageJson?.varlock?.loadPath) return { source: 'loadPath' };
	return null;
}

function isVarlockInstalled(root: string): boolean {
	try {
		createRequire(join(root, 'package.json')).resolve('varlock/exec-sync-varlock');
		return true;
	} catch {
		return false;
	}
}

function readVarlockPackageJson(root: string): VarlockPackageJson | null {
	try {
		const parsed: unknown = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
		return parsed !== null && typeof parsed === 'object' ? (parsed as VarlockPackageJson) : null;
	} catch {
		// No readable `package.json`: there is no `varlock.loadPath` to honour.
		return null;
	}
}
