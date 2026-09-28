import { StringIdParser } from '@wolfstar/http-framework';
import { createSessionId, decodeCustomIdContent, encodeCustomId, PaginatedMessageHandlerName, SessionIdLength } from '../src/index.js';

describe('custom ids', () => {
	test('createSessionId returns base62 ids of the fixed length', () => {
		const ids = new Set(Array.from({ length: 100 }, () => createSessionId()));
		expect(ids.size).toBe(100);
		for (const id of ids) expect(id).toMatch(new RegExp(`^[0-9A-Za-z]{${SessionIdLength}}$`));
	});

	test('encode + StringIdParser + decode round-trips', () => {
		const customId = encodeCustomId(PaginatedMessageHandlerName, 'abcDEF123456', 'next');
		expect(customId).toBe('wolfstar-pm.abcDEF123456.next');
		const parsed = new StringIdParser().run(customId)!;
		expect(parsed.name).toBe(PaginatedMessageHandlerName);
		expect(decodeCustomIdContent(parsed.content)).toEqual({ sessionId: 'abcDEF123456', action: 'next' });
	});

	test('encodeCustomId rejects dots, empty actions, and overlong ids', () => {
		expect(() => encodeCustomId('wolfstar-pm', 'a', 'a.b')).toThrow(TypeError);
		expect(() => encodeCustomId('wolfstar-pm', 'a', '')).toThrow(TypeError);
		expect(() => encodeCustomId('wolfstar-pm', 'a', 'x'.repeat(100))).toThrow(RangeError);
	});

	test('decodeCustomIdContent rejects malformed content', () => {
		expect(decodeCustomIdContent(null)).toBeNull();
		expect(decodeCustomIdContent(['only-one'])).toBeNull();
		expect(decodeCustomIdContent(['a', null])).toBeNull();
	});
});
