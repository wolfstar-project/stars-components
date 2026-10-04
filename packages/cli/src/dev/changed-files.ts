import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git']);
/** `tsc -b` rewrites it on every build, whatever changed. */
const SKIPPED_FILES = /\.tsbuildinfo$/;

/** The content hash of every file under the roots, by absolute path. */
export type FileSnapshot = ReadonlyMap<string, string>;

/**
 * Hashes every file under `roots`, skipping `node_modules`, `.git` and everything under `exclude`.
 *
 * The builders only report that a build finished, and a bundler rewrites files it did not change (`tsdown` writes
 * its whole output on every rebuild), so neither an event nor a modification time says what a build changed: two
 * snapshots do (see {@link changedFiles}).
 */
export function snapshotFiles(roots: readonly string[], exclude: readonly string[] = []): FileSnapshot {
	const snapshot = new Map<string, string>();
	const visit = (directory: string) => {
		let entries;
		try {
			entries = readdirSync(directory, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			const path = join(directory, entry.name);
			if (exclude.some((excluded) => isInside(path, excluded))) continue;
			if (entry.isDirectory()) {
				if (!SKIPPED_DIRECTORIES.has(entry.name)) visit(path);
			} else if (entry.isFile() && !SKIPPED_FILES.test(entry.name)) {
				try {
					snapshot.set(path, createHash('sha1').update(readFileSync(path)).digest('base64'));
				} catch {
					// Removed between the listing and the read: the next build reports it.
				}
			}
		}
	};

	for (const root of new Set(roots)) visit(root);
	return snapshot;
}

/** The files that were added, removed, or whose content differs between two snapshots. */
export function changedFiles(previous: FileSnapshot, next: FileSnapshot): string[] {
	const changed = [...next].filter(([path, hash]) => previous.get(path) !== hash).map(([path]) => path);
	for (const path of previous.keys()) {
		if (!next.has(path)) changed.push(path);
	}

	return changed;
}

/** Whether `path` is `directory` itself or lies under it. */
export function isInside(path: string, directory: string): boolean {
	return path === directory || path.startsWith(directory.endsWith(sep) ? directory : `${directory}${sep}`);
}
