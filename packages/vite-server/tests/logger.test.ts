import * as vite from 'vite';
import { createBuildLogger } from '../src/logger.js';

test('routes info/warn/error through the log callback and de-duplicates warnOnce', () => {
	const events: [string, string][] = [];
	const logger = createBuildLogger(vite, (level, text) => events.push([level, text]));

	logger.info('starting');
	logger.warn('be careful');
	logger.error('boom');
	logger.warnOnce('only once');
	logger.warnOnce('only once');

	expect(events).toEqual([
		['info', 'starting'],
		['warn', 'be careful'],
		['error', 'boom'],
		['warn', 'only once']
	]);
});
