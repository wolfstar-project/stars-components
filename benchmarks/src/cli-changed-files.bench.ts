import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, bench, describe } from 'vitest';
import { changedFiles, snapshotFiles, type HashCache } from '../../packages/cli/src/dev/changed-files.js';

const root = mkdtempSync(join(tmpdir(), 'stars-bench-'));
for (let directory = 0; directory < 10; directory++) {
	mkdirSync(join(root, `commands-${directory}`), { recursive: true });
	for (let file = 0; file < 20; file++) {
		writeFileSync(join(root, `commands-${directory}`, `piece-${file}.js`), `export const piece = ${directory * file};\n`.repeat(50));
	}
}

afterAll(() => rmSync(root, { recursive: true, force: true }));

const warm: HashCache = new Map();
const snapshot = snapshotFiles([root], [], warm);
const edited = new Map(snapshot);
for (const path of [...edited.keys()].filter((_, index) => index % 10 === 0)) edited.set(path, 'changed');

describe('changed files', () => {
	bench('snapshotFiles (200 files, cold cache)', () => {
		snapshotFiles([root]);
	});

	bench('snapshotFiles (200 files, warm cache)', () => {
		snapshotFiles([root], [], warm);
	});

	bench('changedFiles (200 files, 10% edited)', () => {
		changedFiles(snapshot, edited);
	});
});
