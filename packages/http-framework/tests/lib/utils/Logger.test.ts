import { container } from '@sapphire/pieces';
import { LogLevel, Logger } from '../../../src/index.js';

describe('Logger', () => {
	const spies = {
		trace: vi.spyOn(console, 'trace').mockImplementation(() => undefined),
		debug: vi.spyOn(console, 'debug').mockImplementation(() => undefined),
		info: vi.spyOn(console, 'info').mockImplementation(() => undefined),
		warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
		error: vi.spyOn(console, 'error').mockImplementation(() => undefined)
	} as const;

	beforeEach(() => {
		for (const spy of Object.values(spies)) spy.mockClear();
	});

	test('GIVEN no level THEN defaults to Info', () => {
		const logger = new Logger();

		expect(logger.level).toBe(LogLevel.Info);
	});

	test('GIVEN a level THEN has() only accepts levels at or above it', () => {
		const logger = new Logger(LogLevel.Warn);

		expect(logger.has(LogLevel.Debug)).toBe(false);
		expect(logger.has(LogLevel.Info)).toBe(false);
		expect(logger.has(LogLevel.Warn)).toBe(true);
		expect(logger.has(LogLevel.Fatal)).toBe(true);
	});

	test('GIVEN an enabled level THEN writes to the matching console method', () => {
		const logger = new Logger(LogLevel.Trace);

		logger.trace('a');
		logger.debug('b');
		logger.info('c');
		logger.warn('d');
		logger.error('e');
		logger.fatal('f');

		expect(spies.trace).toHaveBeenCalledWith('a');
		expect(spies.debug).toHaveBeenCalledWith('b');
		expect(spies.info).toHaveBeenCalledWith('c');
		expect(spies.warn).toHaveBeenCalledWith('d');
		expect(spies.error).toHaveBeenNthCalledWith(1, 'e');
		expect(spies.error).toHaveBeenNthCalledWith(2, 'f');
	});

	test('GIVEN a disabled level THEN writes nothing', () => {
		const logger = new Logger(LogLevel.Error);

		logger.trace('a');
		logger.debug('b');
		logger.info('c');
		logger.warn('d');

		for (const spy of [spies.trace, spies.debug, spies.info, spies.warn]) {
			expect(spy).not.toHaveBeenCalled();
		}
	});

	test('GIVEN multiple values THEN forwards all of them', () => {
		const logger = new Logger();
		const error = new Error('boom');

		logger.info('failed:', error);

		expect(spies.info).toHaveBeenCalledWith('failed:', error);
	});

	test('GIVEN LogLevel.None THEN silences every level', () => {
		const logger = new Logger(LogLevel.None);

		logger.fatal('a');

		expect(spies.error).not.toHaveBeenCalled();
	});

	test('GIVEN the framework entrypoint THEN container.logger is set', () => {
		expect(container.logger).toBeInstanceOf(Logger);
	});
});
