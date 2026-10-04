import { collectFlag } from '../src/utils/args.js';

describe('collectFlag', () => {
	test('returns every value of a repeated flag, in both spellings', () => {
		expect(collectFlag(['dev', '--channel', 'api', '--no-tui', '--channel=gateway,http', '--channel', 'bot'], 'channel')).toEqual([
			'api',
			'gateway,http',
			'bot'
		]);
	});

	test('ignores a flag without a value, other flags, and everything after --', () => {
		expect(collectFlag(['--channel', '--level', 'warn', '--channels', 'x', '--', '--channel', 'late'], 'channel')).toEqual([]);
		expect(collectFlag([], 'channel')).toEqual([]);
	});
});
