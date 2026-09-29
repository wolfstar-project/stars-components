import {
	ChannelMentionRegex,
	createTwemojiRegex,
	DiscordInviteLinkRegex,
	EmojiRegex,
	MessageLinkRegex,
	RoleMentionRegex,
	SnowflakeRegex,
	UserOrMemberMentionRegex,
	WebhookRegex
} from '../src/index.js';

describe('regexes', () => {
	test('GIVEN a snowflake THEN SnowflakeRegex captures the id', () => {
		expect(SnowflakeRegex.exec('737141877803057244')?.groups?.id).toBe('737141877803057244');
		expect(SnowflakeRegex.test('1234')).toBe(false);
	});

	test('GIVEN mentions THEN the mention regexes capture ids', () => {
		expect(ChannelMentionRegex.exec('<#737141877803057244>')?.groups?.id).toBe('737141877803057244');
		expect(RoleMentionRegex.exec('<@&737141877803057244>')?.groups?.id).toBe('737141877803057244');
		expect(UserOrMemberMentionRegex.exec('<@!266624760782258186>')?.groups?.id).toBe('266624760782258186');
		expect(UserOrMemberMentionRegex.test('<@&266624760782258186>')).toBe(false);
	});

	test('GIVEN a message link THEN MessageLinkRegex captures guild, channel, and message', () => {
		const groups = MessageLinkRegex.exec('https://discord.com/channels/737141877803057244/737142071319855105/1013917972986867862')?.groups;
		expect(groups).toEqual({
			guildId: '737141877803057244',
			channelId: '737142071319855105',
			messageId: '1013917972986867862'
		});
	});

	test('GIVEN an invite THEN DiscordInviteLinkRegex captures the code', () => {
		const regex = new RegExp(DiscordInviteLinkRegex);
		expect(regex.exec('join https://discord.gg/wolfstar today')?.groups?.code).toBe('wolfstar');
	});

	test('GIVEN a custom emoji THEN EmojiRegex captures its parts', () => {
		expect(EmojiRegex.exec('<a:wolf:737141877803057244>')?.groups).toEqual({
			animated: 'a',
			name: 'wolf',
			id: '737141877803057244'
		});
	});

	test('GIVEN a webhook url THEN WebhookRegex captures id and token', () => {
		const groups = WebhookRegex.exec('https://discord.com/api/webhooks/737141877803057244/abc-DEF_123')?.groups;
		expect(groups?.id).toBe('737141877803057244');
		expect(groups?.token).toBe('abc-DEF_123');
	});

	test('GIVEN text with emojis THEN createTwemojiRegex returns a fresh global regex', () => {
		const regex = createTwemojiRegex();
		expect(regex.flags).toContain('g');
		expect('hi 🐺 and 👍🏽'.match(regex)).toEqual(['🐺', '👍🏽']);
		expect(createTwemojiRegex()).not.toBe(regex);
	});
});
