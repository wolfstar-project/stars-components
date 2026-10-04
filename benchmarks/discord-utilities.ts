import type { Bench } from 'tinybench';
import {
	DiscordInviteLinkRegex,
	EmojiRegex,
	MessageLinkRegex,
	SnowflakeRegex,
	UserOrMemberMentionRegex
} from '../packages/discord-utilities/src/lib/regexes.js';
import { ChatInputInteractionOptionResolver } from '../packages/discord-utilities/src/lib/resolvers/ChatInputInteractionOptionResolver.js';
import { chatInputInteraction } from './fixtures.js';

const identifiers = [
	'266624760782258186',
	'<@266624760782258186>',
	'<@!266624760782258186>',
	'<a:wolf_dance:737141877803057244>',
	'https://discord.com/channels/737141877803057244/737141877803057245/1116431862224961597',
	'not an identifier at all'
];

const chatLog = Array.from(
	{ length: 50 },
	(_, index) => `Message ${index}: hey, join our server at https://discord.gg/wolfstar${index} or discord.com/invite/stars-${index}, it is great!`
).join('\n');

export function register(bench: Bench) {
	bench
		.add('discord-utilities: ChatInputInteractionOptionResolver (construct + read)', () => {
			const resolver = new ChatInputInteractionOptionResolver(chatInputInteraction);
			resolver.getSubcommandGroup();
			resolver.getSubcommand();
			resolver.getUser('target');
			resolver.getMember('target');
			resolver.getChannel('channel');
			resolver.getRole('role');
			resolver.getMentionable('mention');
			resolver.getString('reason');
			resolver.getInteger('duration');
			resolver.getNumber('ratio');
			resolver.getBoolean('silent');
		})
		.add('discord-utilities: identifier regexes', () => {
			for (const input of identifiers) {
				SnowflakeRegex.exec(input);
				UserOrMemberMentionRegex.exec(input);
				EmojiRegex.exec(input);
				MessageLinkRegex.exec(input);
			}
		})
		.add('discord-utilities: scan invite links in chat log', () => {
			let count = 0;
			for (const _ of chatLog.matchAll(DiscordInviteLinkRegex)) count++;
			if (count === 0) throw new Error('Expected invite links');
		});
}
