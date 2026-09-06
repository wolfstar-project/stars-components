import { isErrorDetail, LogBuffer, matchesLevel } from '../src/lib/log-buffer.js';

describe('LogBuffer', () => {
	test('keeps a bounded history and filters it', () => {
		const logs = new LogBuffer(2);
		logs.push({ source: 'stars', level: 'info', text: 'starting' });
		logs.push({ source: 'build', level: 'warn', text: 'deprecated' });
		logs.push({ source: 'app', level: 'error', text: 'boom' });

		expect(logs.entries().map(({ text }) => text)).toEqual(['deprecated', 'boom']);
		expect(logs.filter({ level: 'warn' }).map(({ text }) => text)).toEqual(['deprecated', 'boom']);
		expect(matchesLevel('info', 'warn')).toBe(false);
	});
});

describe('isErrorDetail', () => {
	test.each(['    at Client.load (Client.ts:153:3)', "  type: 'EMPTY_MODULE'", "  path: '/tmp/piece.mjs'", '}'])(
		'treats %j as part of the preceding application error',
		(text) => {
			expect(isErrorDetail({ source: 'app', level: 'error', text })).toBe(true);
		}
	);

	test.each([
		{ source: 'app' as const, level: 'error' as const, text: "Error when loading 'piece.mjs'" },
		{ source: 'build' as const, level: 'error' as const, text: '    at plugin.transform' },
		{ source: 'app' as const, level: 'info' as const, text: '    at startup' }
	])('keeps $source/$level $text as an independent message', (entry) => {
		expect(isErrorDetail(entry)).toBe(false);
	});
});
