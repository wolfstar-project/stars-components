import { ButtonLimits, EmbedLimits, MessageLimits, SelectMenuLimits } from '../src/index.js';

describe('limits', () => {
	test('GIVEN MessageLimits THEN matches the Discord documentation', () => {
		expect(MessageLimits.MaximumLength).toBe(2000);
		expect(MessageLimits.MaximumEmbeds).toBe(10);
		expect(MessageLimits.MaximumActionRows).toBe(5);
	});

	test('GIVEN EmbedLimits THEN matches the Discord documentation', () => {
		expect(EmbedLimits).toMatchObject({
			MaximumTitleLength: 256,
			MaximumDescriptionLength: 4096,
			MaximumFields: 25,
			MaximumFieldNameLength: 256,
			MaximumFieldValueLength: 1024,
			MaximumFooterLength: 2048,
			MaximumAuthorNameLength: 256,
			MaximumTotalCharacters: 6000
		});
	});

	test('GIVEN component limits THEN matches the Discord documentation', () => {
		expect(ButtonLimits.MaximumCustomIdCharacters).toBe(100);
		expect(ButtonLimits.MaximumLabelCharacters).toBe(80);
		expect(SelectMenuLimits.MaximumOptionsLength).toBe(25);
	});
});
