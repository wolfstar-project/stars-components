import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAnnouncement, render, renderComponents, renderText, type Announcement } from '../src/announcement.ts';
import { textLength, validate } from '../src/discord.ts';

const announcement: Announcement = {
	skip: false,
	skipReason: '',
	format: 'components',
	title: 'Staryl is live',
	summary: 'Staryl is now out as a stable release.',
	sections: [
		{
			emoji: '📣',
			heading: "What's new",
			headingStyle: 'heading',
			intro: '',
			bullets: [{ text: '**Twitch notifications**: get a message when a streamer goes live.', children: ['Pick the channel.'] }]
		},
		{
			emoji: '🔜',
			heading: 'Coming soon',
			headingStyle: 'heading',
			intro: '',
			bullets: [{ text: 'More platforms. No dates yet.', children: [] }]
		}
	],
	closing: 'If slash commands do not show up, re-invite the bot.',
	screenshots: []
};

const options = {
	roleId: '42',
	buttons: [{ label: 'Invite Staryl', url: 'https://discord.com/oauth2/authorize?client_id=1' }],
	images: [{ file: 'after-12.png', caption: 'The new page' }]
};

describe('Components V2 rendering', () => {
	it('builds a gold container with the ping outside it', () => {
		const [message] = renderComponents(announcement, options);
		const components = message!.payload.components!;
		assert.equal(message!.payload.flags, 1 << 15);
		assert.equal(message!.payload.content, undefined);
		assert.deepEqual(components[0], { type: 10, content: 'New announcement for <@&42>:' });
		const container = components[1]!;
		assert.equal(container.type, 17);
		assert.equal(container.accent_color, 0xfec609);
		const inner = container.components as { type: number; content?: string; items?: unknown[] }[];
		assert.equal(inner[0]!.content, '# Staryl is live\nStaryl is now out as a stable release.');
		assert.equal(
			inner[2]!.content,
			"## 📣 What's new\n- **Twitch notifications**: get a message when a streamer goes live.\n  - Pick the channel."
		);
		assert.equal(inner[3]!.type, 12);
		assert.deepEqual(inner[3]!.items, [{ media: { url: 'attachment://after-12.png' }, description: 'The new page' }]);
		assert.equal(inner.at(-1)!.type, 1);
		assert.deepEqual(message!.files, ['after-12.png']);
		assert.deepEqual(message!.payload.allowed_mentions, { parse: [], roles: ['42'] });
		validate(message!);
	});

	it('falls back to text when the container is too long', () => {
		const long = {
			...announcement,
			sections: [{ ...announcement.sections[0]!, bullets: Array.from({ length: 12 }, () => ({ text: 'x'.repeat(400), children: [] })) }]
		};
		const messages = render(long, { ...options, images: [] });
		assert.ok(messages.every((message) => message.payload.components === undefined));
		assert.ok(messages.every((message) => (message.payload.content?.length ?? 0) <= 2000));
	});
});

describe('text rendering', () => {
	it('matches the Skyra layout', () => {
		const messages = renderText(
			{
				...announcement,
				format: 'text',
				sections: [
					{
						emoji: '',
						heading: 'Updated **WolfStar Alpha**',
						headingStyle: 'label',
						intro: '',
						bullets: [{ text: '`/commands` can block users', children: ['Exclusions win.'] }]
					}
				]
			},
			{ ...options, buttons: [] }
		);
		assert.equal(messages.length, 1);
		assert.equal(
			messages[0]!.payload.content,
			'New announcement for <@&42>:\n## Staryl is live\nStaryl is now out as a stable release.\n\nUpdated **WolfStar Alpha**:\n- `/commands` can block users\n  - Exclusions win.\n\n*If slash commands do not show up, re-invite the bot.*'
		);
		assert.deepEqual(messages[0]!.files, ['after-12.png']);
	});
});

describe('agent result', () => {
	it('accepts the schema shape and a skip', () => {
		assert.equal(parseAnnouncement(JSON.stringify(announcement)).title, 'Staryl is live');
		assert.equal(parseAnnouncement('{"skip":true,"skipReason":"internal only"}').skipReason, 'internal only');
	});

	it('rejects broken results', () => {
		assert.throws(() => parseAnnouncement('not json'), /not JSON/);
		assert.throws(() => parseAnnouncement(JSON.stringify({ ...announcement, sections: [] })), /sections/);
		assert.throws(() => parseAnnouncement(JSON.stringify({ ...announcement, format: 'embed' })), /format/);
	});

	it('counts text across nested components', () => {
		assert.equal(
			textLength([
				{ type: 10, content: 'abc' },
				{ type: 17, components: [{ type: 10, content: 'de' }] }
			]),
			5
		);
	});
});
