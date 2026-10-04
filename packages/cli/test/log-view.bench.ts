import { bench, describe } from 'vitest';
import { buildRows, highlight, initialLogView, matchesView } from '../src/dev/tui/log-view.js';
import { LogBuffer, type LogInput } from '../src/utils/log-buffer.js';

const CHANNELS = ['bot', 'cli', 'hmr', 'http', 'commands', 'build'] as const;

function fill(count: number) {
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

const entries = fill(2000);
const filter = initialLogView({ dev: { logs: { channels: null, levels: ['error', 'warn', 'info', 'debug'], dir: null, keep: 10 } } });
const line = 'POST https://bot.example.com/interactions 200 12ms from ./src/commands/ping.ts:42:7 `ping` slash:ping';

describe('log view', () => {
	bench('buildRows (2000 entries, by time)', () => {
		buildRows(entries);
	});

	bench('buildRows (2000 entries, grouped by channel)', () => {
		buildRows(entries, { group: true });
	});

	bench('matchesView (2000 entries, search query)', () => {
		const query = { ...filter, query: 'ping' };
		for (const entry of entries) matchesView(entry, query);
	});

	bench('highlight (one http line)', () => {
		highlight(line, 'http');
	});
});
