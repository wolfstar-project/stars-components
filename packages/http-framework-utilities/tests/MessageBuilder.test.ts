import { MessageFlags } from 'discord-api-types/v10';
import { MessageBuilder, validateMessage } from '../src/index.js';

describe('MessageBuilder', () => {
	test('GIVEN chained setters THEN toJSON returns the body', () => {
		const body = new MessageBuilder()
			.setContent('hi')
			.addEmbeds({ title: 'a' })
			.addEmbeds({ title: 'b' })
			.setFlags(MessageFlags.Ephemeral)
			.setAllowedMentions({ parse: [] })
			.setTTS()
			.toJSON();

		expect(body).toEqual({
			content: 'hi',
			embeds: [{ title: 'a' }, { title: 'b' }],
			flags: MessageFlags.Ephemeral,
			allowed_mentions: { parse: [] },
			tts: true
		});
	});

	test('GIVEN null THEN the field is removed', () => {
		expect(new MessageBuilder({ content: 'x' }).setContent(null).toJSON()).toEqual({});
	});

	test('GIVEN toJSON THEN mutating the result does not change the builder', () => {
		const builder = new MessageBuilder().addEmbeds({ title: 'a' });
		builder.toJSON().embeds!.push({ title: 'b' });
		expect(builder.toJSON().embeds).toHaveLength(1);
	});
});

describe('validateMessage', () => {
	test('GIVEN content over the limit THEN throws naming content', () => {
		expect(() => validateMessage({ content: 'x'.repeat(2001) })).toThrow(
			new RangeError('content must be at most 2000 characters, received 2001')
		);
	});

	test('GIVEN too many embeds THEN throws naming embeds', () => {
		expect(() => validateMessage({ embeds: Array.from({ length: 11 }, () => ({})) })).toThrow(
			'embeds must contain at most 10 entries, received 11'
		);
	});

	test('GIVEN a long embed field THEN throws with its path', () => {
		expect(() => validateMessage({ embeds: [{ fields: [{ name: 'n', value: 'v'.repeat(1025) }] }] })).toThrow(
			'embeds[0].fields[0].value must be at most 1024 characters, received 1025'
		);
	});

	test('GIVEN embeds over 6000 total characters THEN throws', () => {
		const description = 'd'.repeat(4000);
		expect(() => validateMessage({ embeds: [{ description }, { description }] })).toThrow(
			'embeds must total at most 6000 characters, received 8000'
		);
	});

	test('GIVEN too many action rows THEN throws naming components', () => {
		expect(() => validateMessage({ components: Array.from({ length: 6 }, () => ({ type: 1, components: [] })) as never })).toThrow(
			'components must contain at most 5 entries, received 6'
		);
	});
});
