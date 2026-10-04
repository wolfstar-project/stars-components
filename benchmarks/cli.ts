import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Bench } from 'tinybench';
import { changedFiles, snapshotFiles, type HashCache } from '../packages/cli/src/dev/changed-files.js';
import { buildRows, highlight, initialLogView, matchesView } from '../packages/cli/src/dev/tui/log-view.js';
import { LogBuffer, type LogInput } from '../packages/cli/src/utils/log-buffer.js';

const CHANNELS = ['bot', 'cli', 'hmr', 'http', 'commands', 'build'];

function fillLogs(count: number) {
	const logs = new LogBuffer(count);
	for (let index = 0; index < count; index++) {
		const input: LogInput = {
			source: 'stars',
			channel: CHANNELS[index % CHANNELS.length],
			level: index % 50 === 0 ? 'error' : index % 7 === 0 ? 'warn' : index % 3 === 0 ? 'trace' : 'info',
			text: `POST https://bot.example.com/interactions 200 ${index}ms\nat ./src/commands/ping.ts:${index}:12`,
			detail: index % 10 === 0 ? ['changed ping', 'added pong'] : undefined
		};
		logs.push(input);
	}

	return logs.entries();
}

function writeFixture() {
	const root = mkdtempSync(join(tmpdir(), 'stars-bench-'));
	for (let directory = 0; directory < 10; directory++) {
		mkdirSync(join(root, `commands-${directory}`), { recursive: true });
		for (let file = 0; file < 20; file++) {
			writeFileSync(join(root, `commands-${directory}`, `piece-${file}.js`), `export const piece = ${directory * file};\n`.repeat(50));
		}
	}

	process.once('exit', () => rmSync(root, { recursive: true, force: true }));
	return root;
}

export function register(bench: Bench) {
	const entries = fillLogs(2000);
	const filter = initialLogView({ dev: { logs: { channels: null, levels: ['error', 'warn', 'info', 'debug'], dir: null, keep: 10 } } });
	const searching = { ...filter, query: 'ping' };
	const line = 'POST https://bot.example.com/interactions 200 12ms from ./src/commands/ping.ts:42:7 `ping` slash:ping';

	const root = writeFixture();
	const warm: HashCache = new Map();
	const snapshot = snapshotFiles([root], [], warm);
	const edited = new Map(snapshot);
	for (const path of [...edited.keys()].filter((_, index) => index % 10 === 0)) edited.set(path, 'changed');

	bench
		.add('cli: buildRows (2000 entries, by time)', () => {
			buildRows(entries);
		})
		.add('cli: buildRows (2000 entries, grouped by channel)', () => {
			buildRows(entries, { group: true });
		})
		.add('cli: matchesView (2000 entries, search query)', () => {
			for (const entry of entries) matchesView(entry, searching);
		})
		.add('cli: highlight (one http line)', () => {
			highlight(line, 'http');
		})
		.add('cli: snapshotFiles (200 files, cold cache)', () => {
			snapshotFiles([root]);
		})
		.add('cli: snapshotFiles (200 files, warm cache)', () => {
			snapshotFiles([root], [], warm);
		})
		.add('cli: changedFiles (200 files, 10% edited)', () => {
			changedFiles(snapshot, edited);
		});
}
