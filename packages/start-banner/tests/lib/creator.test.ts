import { createBanner, createStarsBanner, DEFAULT_STARS_LOGO } from '../../src/index.js';

describe('createBanner', () => {
	test('GIVEN no options THEN throws an Error', () => {
		expect(() => createBanner({})).toThrow('Expected any of the options to be passed');
	});

	describe('no logo', () => {
		test('GIVEN name THEN returns name', () => {
			expect(createBanner({ name: ['Hello', 'World'] })).toBe('Hello\nWorld');
		});

		test('GIVEN extra THEN returns extra', () => {
			expect(createBanner({ extra: ['Hello', 'World'] })).toBe('Hello\nWorld');
		});

		test('GIVEN name and extra THEN returns name and extra', () => {
			expect(createBanner({ name: ['Hello', 'World'], extra: ['Foo', 'Bar'] })).toBe('Hello\nWorld\nFoo\nBar');
		});
	});

	describe('logo', () => {
		test('GIVEN no details THEN returns logo as-is', () => {
			expect(createBanner({ logo: ['Hello', 'Foo'] })).toBe('Hello\nFoo');
		});

		test('GIVEN name THEN returns padded logo with name', () => {
			expect(createBanner({ logo: ['Hello', 'Foo'], name: ['Wolfstar'] })).toBe('Hello Wolfstar\nFoo');
		});

		test('GIVEN extra THEN returns padded logo with extra', () => {
			expect(createBanner({ logo: ['Hello', 'Foo'], extra: ['Wolfstar'] })).toBe('Hello Wolfstar\nFoo');
		});

		test('GIVEN name and extra THEN returns padded logo with details', () => {
			expect(createBanner({ logo: ['Hello', 'Foo'], name: ['Wolfstar'], extra: ['Moderation: ON'] })).toBe(
				'Hello Wolfstar\nFoo   Moderation: ON'
			);
		});

		test('GIVEN name and extra with overflow THEN returns padded logo with padded details', () => {
			expect(createBanner({ logo: ['Hello', 'Foo'], name: ['Wolfstar'], extra: ['Moderation: ON', 'Analytics : ON'] })).toBe(
				'Hello Wolfstar\nFoo   Moderation: ON\n      Analytics : ON'
			);
		});
	});
});

describe('createStarsBanner', () => {
	test('uses the compact Stars logo by default', () => {
		expect(createStarsBanner()).toBe(DEFAULT_STARS_LOGO.join('\n'));
		expect(createStarsBanner({ name: ['My bot'] })).toContain('My bot');
	});

	test('replaces the default logo with a custom one', () => {
		expect(createStarsBanner({ logo: ['BOT'], name: ['My bot'] })).toBe('BOT My bot');
	});

	test('supports a text-only banner', () => {
		expect(createStarsBanner({ logo: false, name: ['My bot'], extra: ['Ready'] })).toBe('My bot\nReady');
	});
});
