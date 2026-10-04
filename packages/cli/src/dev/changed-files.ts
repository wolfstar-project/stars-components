import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, sep } from 'node:path';

const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git']);
/**
 * `tsc -b` rewrites its build info on every build, whatever changed; a source map only ever changes with the file it
 * maps, and is most of what there would be to read.
 */
const SKIPPED_FILES = /\.(?:tsbuildinfo|map)$/;

/** The content hash of every file under the roots, by absolute path. */
export type FileSnapshot = ReadonlyMap<string, string>;

/** What was last read of each file, so one that was not touched since is not read again. */
export type HashCache = Map<string, { size: number; mtimeMs: number; hash: string }>;

/**
 * Hashes every file under `roots`, skipping `node_modules`, `.git` and everything under `exclude`.
 *
 * The builders only report that a build finished, and a bundler rewrites files it did not change (`tsdown` writes
 * its whole output on every rebuild), so neither an event nor a modification time says what a build changed: two
 * snapshots do (see {@link changedFiles}).
 */
export function snapshotFiles(roots: readonly string[], exclude: readonly string[] = [], cache: HashCache = new Map()): FileSnapshot {
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
					const { size, mtimeMs } = statSync(path);
					const known = cache.get(path);
					const hash =
						known?.size === size && known.mtimeMs === mtimeMs
							? known.hash
							: createHash('sha1').update(readFileSync(path)).digest('base64');
					cache.set(path, { size, mtimeMs, hash });
					snapshot.set(path, hash);
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

const PIECE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']);

/**
 * Whether a file a store has not loaded yet could be a piece, by the rule the stores filter files with: a script
 * that is not a declaration file and whose name does not start with `_`.
 */
export function couldBePiece(path: string): boolean {
	const extension = extname(path);
	return PIECE_EXTENSIONS.has(extension) && !path.endsWith('.d.ts') && !basename(path, extension).startsWith('_');
}

/** Whether `path` is `directory` itself or lies under it. */
export function isInside(path: string, directory: string): boolean {
	return path === directory || path.startsWith(directory.endsWith(sep) ? directory : `${directory}${sep}`);
}
