import type { ResolvedStarsConfig } from '@wolfstar/schema';
import {
	buildRows,
	formatClock,
	highlight,
	initialLogView,
	isChannelVisible,
	levelBadge,
	matchesView,
	soloChannel,
	soloLevel,
	toggleChannel,
	toggleLevel
} from '../src/dev/tui/log-view.js';
import { LogBuffer, type LogInput } from '../src/utils/log-buffer.js';

const config = (logs: Partial<ResolvedStarsConfig['dev']['logs']> = {}) =>
	({ dev: { logs: { channels: null, levels: ['error', 'warn', 'info', 'debug'], dir: null, keep: 10, ...logs } } }) as Pick<
		ResolvedStarsConfig,
		'dev'
	>;

function entries(...inputs: LogInput[]) {
	const logs = new LogBuffer();
	for (const input of inputs) logs.push(input);
	return logs.entries();
}

describe('LogBuffer channels', () => {
	test('defaults the channel to the source and remembers every channel seen', () => {
		const logs = new LogBuffer();
		expect(logs.push({ source: 'stars', level: 'info', text: 'a' }).channel).toBe('cli');
		expect(logs.push({ source: 'app', level: 'info', text: 'b' }).channel).toBe('bot');
		expect(logs.push({ source: 'tsc', level: 'error', text: 'c' }).channel).toBe('types');
		expect(logs.push({ source: 'stars', channel: 'hmr', level: 'debug', text: 'd' }).channel).toBe('hmr');
		logs.clear();
		expect(logs.channels()).toEqual(['bot', 'cli', 'hmr', 'types']);
	});
});

describe('log view filter', () => {
	test('starts from dev.logs, and flags win over it', () => {
		const preset = initialLogView(config({ channels: ['bot'], levels: ['error'] }));
		expect([...preset.allow!]).toEqual(['bot']);
		expect([...preset.levels]).toEqual(['error']);

		const flagged = initialLogView(config({ channels: ['bot'] }), { channels: ['hmr, http', 'commands'], level: 'info' });
		expect([...flagged.allow!]).toEqual(['hmr', 'http', 'commands']);
		// `--level info` is info and everything more severe.
		expect([...flagged.levels].sort()).toEqual(['error', 'info', 'warn']);
		expect(initialLogView(config()).allow).toBeNull();
	});

	test('matches by channel, level and text, with success filtered as info', () => {
		const [info, ok, traced, block] = entries(
			{ source: 'app', level: 'info', text: 'Hello' },
			{ source: 'stars', level: 'success', text: 'Build succeeded' },
			{ source: 'stars', channel: 'http', level: 'trace', text: 'POST / 200' },
			{ source: 'stars', channel: 'commands', level: 'info', text: 'Commands updated', detail: ['changed ping'] }
		);
		const filter = initialLogView(config());
		expect(matchesView(info!, filter)).toBe(true);
		expect(matchesView(ok!, filter)).toBe(true);
		expect(matchesView(traced!, filter)).toBe(false);
		expect(matchesView(ok!, { ...filter, levels: new Set(['info']) })).toBe(true);
		expect(matchesView(info!, { ...filter, query: 'HELL' })).toBe(true);
		expect(matchesView(info!, { ...filter, query: 'nope' })).toBe(false);
		// The search reaches the detail lines too.
		expect(matchesView(block!, { ...filter, query: 'ping' })).toBe(true);
	});

	test('toggles and solos channels, keeping a preset in force for channels that log later', () => {
		const all = initialLogView(config());
		const hidden = toggleChannel(all, 'bot');
		expect(isChannelVisible(hidden, 'bot')).toBe(false);
		expect(isChannelVisible(hidden, 'hmr')).toBe(true);
		expect(isChannelVisible(toggleChannel(hidden, 'bot'), 'bot')).toBe(true);

		const preset = initialLogView(config({ channels: ['bot'] }));
		expect(isChannelVisible(preset, 'hmr')).toBe(false);
		expect(isChannelVisible(toggleChannel(preset, 'hmr'), 'hmr')).toBe(true);

		const solo = soloChannel(hidden, 'hmr');
		expect(isChannelVisible(solo, 'hmr')).toBe(true);
		expect(isChannelVisible(solo, 'bot')).toBe(false);
		expect(isChannelVisible(soloChannel(solo, 'hmr'), 'bot')).toBe(true);
	});

	test('toggles and solos levels, never leaving the view without one', () => {
		const filter = initialLogView(config({ levels: ['error'] }));
		expect(toggleLevel(filter, 'error')).toBe(filter);
		expect([...toggleLevel(filter, 'warn').levels].sort()).toEqual(['error', 'warn']);
		const solo = soloLevel(initialLogView(config()), 'warn');
		expect([...solo.levels]).toEqual(['warn']);
		expect(soloLevel(solo, 'warn').levels.size).toBe(5);
	});
});

describe('buildRows', () => {
	test('folds stack frames, splits multi-line messages and rules off blocks', () => {
		const rows = buildRows(
			entries(
				{ source: 'stars', level: 'info', text: 'before' },
				{ source: 'stars', channel: 'commands', level: 'debug', text: 'Loaded commands', detail: ['ping', 'echo'] },
				{ source: 'app', level: 'error', text: 'Error: boom' },
				{ source: 'app', level: 'error', text: '    at main (main.js:1:1)' },
				{ source: 'stars', level: 'error', text: 'Crash\nframe one', detail: ['hint'] },
				{ source: 'stars', channel: 'hmr', level: 'debug', text: 'block at the end', detail: ['one'] }
			)
		);

		expect(rows.map((row) => (row.kind === 'entry' || row.kind === 'detail' ? `${row.kind}:${row.text}` : row.kind))).toEqual([
			'entry:before',
			'rule',
			'entry:Loaded commands',
			'detail:ping',
			'detail:echo',
			'rule',
			'entry:Error: boom',
			'detail:at main (main.js:1:1)',
			// An error keeps its hint under it without becoming a block.
			'entry:Crash',
			'detail:frame one',
			'detail:hint',
			'rule',
			'entry:block at the end',
			'detail:one'
		]);
	});

	test('groups by channel in the order the channels first logged', () => {
		const rows = buildRows(
			entries(
				{ source: 'app', level: 'info', text: 'bot 1' },
				{ source: 'stars', level: 'info', text: 'cli 1' },
				{ source: 'app', level: 'info', text: 'bot 2' }
			),
			{ group: true }
		);
		expect(rows.map((row) => (row.kind === 'header' ? `${row.channel}:${row.count}` : row.kind === 'entry' ? row.text : row.kind))).toEqual([
			'bot:2',
			'bot 1',
			'bot 2',
			'cli:1',
			'cli 1'
		]);
	});

	test('strips colour codes the bot printed', () => {
		const [row] = buildRows(entries({ source: 'app', level: 'info', text: '\u001B[32mready\u001B[39m' }));
		expect(row).toMatchObject({ kind: 'entry', text: 'ready' });
	});

	test('expands tabs and drops control characters, which a terminal would render wider than they count', () => {
		const rows = buildRows(entries({ source: 'app', level: 'error', text: '\t\tif (broken) throw\r\n\tnext\u0007', detail: ['\thint'] }));
		expect(rows.map((row) => (row.kind === 'rule' || row.kind === 'header' ? row.kind : row.text))).toEqual([
			'    if (broken) throw',
			'  next',
			'  hint'
		]);
	});
});

describe('highlight', () => {
	const tokens = (text: string, channel?: string) =>
		highlight(text, channel)
			.filter((segment) => segment.token !== undefined)
			.map((segment) => `${segment.token}:${segment.text}`);

	test('tells URLs, paths, names and numbers apart and keeps the text whole', () => {
		const text = 'Reloaded `Ping` from ./src/handlers/Ping.ts in 4ms, see https://example.com/a?b=1';
		expect(tokens(text)).toEqual(['name:`Ping`', 'path:./src/handlers/Ping.ts', 'number:4ms', 'url:https://example.com/a?b=1']);
		expect(
			highlight(text)
				.map((segment) => segment.text)
				.join('')
		).toBe(text);
	});

	test('marks routes, methods and ids, and classes the status on the http channel only', () => {
		expect(tokens('Processing slash:ping with Ping')).toEqual(['name:slash:ping']);
		expect(tokens('00000000-0000-4000-8000-000000000000 | failed')).toEqual(['dim:00000000-0000-4000-8000-000000000000']);
		expect(tokens('POST / 200 in 3ms', 'http')).toEqual(['name:POST', 'ok:200', 'number:3ms']);
		expect(tokens('POST / 401 in 3ms', 'http')).toEqual(['name:POST', 'warn:401', 'number:3ms']);
		expect(tokens('POST / 500 in 3ms', 'http')).toEqual(['name:POST', 'error:500', 'number:3ms']);
		expect(tokens('Deployed 200 commands')).toEqual(['number:200']);
		expect(tokens('nothing to see here')).toEqual([]);
	});
});

describe('formatting', () => {
	test('badges and clock', () => {
		expect((['trace', 'debug', 'info', 'success', 'warn', 'error'] as const).map(levelBadge).join('')).toBe('TDIIWE');
		expect(formatClock(new Date(2026, 9, 3, 7, 5, 9).getTime())).toBe('07:05:09');
	});
});
