import {
	COMPONENTS_TEXT_LIMIT,
	MESSAGE_FLAGS,
	allowedMentions,
	chunkBlocks,
	pingLine,
	textLength,
	type Component,
	type StoredMessage
} from './discord.ts';

// The agent writes the words; this file decides what Discord receives. Keeping
// the payload out of the model's hands means every message is valid, pings only
// the announced role, and carries the buttons and screenshots we chose.

export interface Bullet {
	text: string;
	children: string[];
}

export interface Section {
	emoji: string;
	heading: string;
	headingStyle: 'label' | 'heading';
	intro: string;
	bullets: Bullet[];
}

export interface Screenshot {
	pr: number;
	caption: string;
}

export interface Announcement {
	skip: boolean;
	skipReason: string;
	format: 'text' | 'components';
	title: string;
	summary: string;
	sections: Section[];
	closing: string;
	screenshots: Screenshot[];
}

const string = { type: 'string' } as const;

/** Draft-07 JSON Schema the Pullfrog agent's result must match (`output_schema`). */
export const ANNOUNCEMENT_SCHEMA = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	type: 'object',
	additionalProperties: false,
	required: ['skip', 'skipReason', 'format', 'title', 'summary', 'sections', 'closing', 'screenshots'],
	properties: {
		skip: { type: 'boolean', description: 'true when nothing in the release is visible to users.' },
		skipReason: { ...string, description: 'Why the release is skipped. Empty otherwise.' },
		format: { type: 'string', enum: ['text', 'components'] },
		title: { ...string, description: 'Plain title, no emoji, no markdown.' },
		summary: { ...string, description: 'One sentence on what is live.' },
		sections: {
			type: 'array',
			minItems: 1,
			maxItems: 8,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['emoji', 'heading', 'headingStyle', 'intro', 'bullets'],
				properties: {
					emoji: { ...string, description: 'One emoji for the Components V2 heading, or empty.' },
					heading: { ...string, description: 'Section heading. Markdown bold is allowed.' },
					headingStyle: {
						type: 'string',
						enum: ['label', 'heading'],
						description: 'label renders as "Updated **WolfStar**:"; heading renders as a markdown heading.'
					},
					intro: { ...string, description: 'Optional paragraph before the bullets.' },
					bullets: {
						type: 'array',
						maxItems: 12,
						items: {
							type: 'object',
							additionalProperties: false,
							required: ['text', 'children'],
							properties: {
								text: string,
								children: { type: 'array', maxItems: 4, items: string }
							}
						}
					}
				}
			}
		},
		closing: { ...string, description: 'One closing line rendered in italics, such as the re-invite hint. Empty for none.' },
		screenshots: {
			type: 'array',
			maxItems: 4,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['pr', 'caption'],
				properties: {
					pr: { type: 'integer', description: 'A pull request number from the list of available screenshots.' },
					caption: { ...string, description: 'Alt text describing the screen.' }
				}
			}
		}
	}
} as const;

/** Parses and checks the agent's JSON. Throws with a readable reason. */
export function parseAnnouncement(raw: string): Announcement {
	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		throw new Error('The agent result is not JSON');
	}
	if (!isRecord(value)) throw new Error('The agent result is not an object');
	const announcement = value as unknown as Announcement;
	if (typeof announcement.skip !== 'boolean') throw new Error('"skip" must be a boolean');
	if (announcement.skip) return { ...emptyAnnouncement(), skip: true, skipReason: String(announcement.skipReason ?? '') };
	if (announcement.format !== 'text' && announcement.format !== 'components') throw new Error('"format" must be text or components');
	if (typeof announcement.title !== 'string' || announcement.title.trim() === '') throw new Error('"title" is empty');
	if (!Array.isArray(announcement.sections) || announcement.sections.length === 0) throw new Error('"sections" is empty');
	for (const section of announcement.sections) {
		if (!isRecord(section) || typeof section.heading !== 'string' || !Array.isArray(section.bullets)) {
			throw new Error('Every section needs a heading and bullets');
		}
		for (const bullet of section.bullets) {
			if (!isRecord(bullet) || typeof bullet.text !== 'string' || !Array.isArray(bullet.children)) {
				throw new Error('Every bullet needs text and children');
			}
		}
	}
	return {
		...announcement,
		summary: String(announcement.summary ?? ''),
		closing: String(announcement.closing ?? ''),
		screenshots: Array.isArray(announcement.screenshots) ? announcement.screenshots : []
	};
}

function emptyAnnouncement(): Announcement {
	return { skip: false, skipReason: '', format: 'text', title: '', summary: '', sections: [], closing: '', screenshots: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export interface Button {
	label: string;
	url: string;
}

export interface RenderOptions {
	roleId: string;
	username?: string;
	avatarUrl?: string;
	buttons: Button[];
	/** Attachment file names, in the order of `announcement.screenshots` that could be downloaded. */
	images: { file: string; caption: string }[];
}

/** WolfStar gold, `#FEC609`. */
export const ACCENT_COLOR = 0xfec609;

function bulletLines(bullets: Bullet[]): string[] {
	const lines: string[] = [];
	for (const bullet of bullets) {
		lines.push(`- ${bullet.text.trim()}`);
		for (const child of bullet.children) lines.push(`  - ${child.trim()}`);
	}
	return lines;
}

function closingLine(closing: string): string {
	const text = closing.trim();
	if (!text) return '';
	return text.startsWith('*') && text.endsWith('*') ? text : `*${text}*`;
}

/** Skyra and WolfStar Announcements style: one or more plain messages. */
export function renderText(announcement: Announcement, options: RenderOptions): StoredMessage[] {
	const blocks: string[] = [];
	const head = [pingLine(options.roleId), `## ${announcement.title.trim()}`, announcement.summary.trim()].filter(Boolean);
	blocks.push(head.join('\n'));

	for (const section of announcement.sections) {
		const heading = section.heading.trim();
		const title = section.headingStyle === 'heading' ? `### ${heading}` : heading.endsWith(':') ? heading : `${heading}:`;
		blocks.push([title, section.intro.trim(), ...bulletLines(section.bullets)].filter(Boolean).join('\n'));
	}

	const footer = [closingLine(announcement.closing), ...options.buttons.map((button) => `${button.label}: <${button.url}>`)].filter(Boolean);
	if (footer.length) blocks.push(footer.join('\n'));

	const chunks = chunkBlocks(blocks);
	return chunks.map((content, index) => {
		const last = index === chunks.length - 1;
		return {
			payload: {
				content,
				flags: MESSAGE_FLAGS.SuppressEmbeds,
				allowed_mentions: index === 0 ? allowedMentions(options.roleId) : allowedMentions(''),
				...identity(options)
			},
			files: last ? options.images.map((image) => image.file) : []
		};
	});
}

/** WolfStar Announcements Components V2 style: a gold container with separators and link buttons. */
export function renderComponents(announcement: Announcement, options: RenderOptions): StoredMessage[] {
	const separator: Component = { type: 14, divider: true, spacing: 1 };
	const inner: Component[] = [];
	const text = (content: string): Component => ({ type: 10, content });

	inner.push(text([`# ${announcement.title.trim()}`, announcement.summary.trim()].filter(Boolean).join('\n')));

	for (const [index, section] of announcement.sections.entries()) {
		inner.push(separator);
		const heading = `## ${[section.emoji.trim(), section.heading.trim().replace(/:$/, '')].filter(Boolean).join(' ')}`;
		inner.push(text([heading, section.intro.trim(), ...bulletLines(section.bullets)].filter(Boolean).join('\n')));
		// The screenshots follow the first section, which is what's new.
		if (index === 0 && options.images.length > 0) {
			inner.push({
				type: 12,
				items: options.images.map((image) => ({
					media: { url: `attachment://${image.file}` },
					...(image.caption ? { description: image.caption.slice(0, 1024) } : {})
				}))
			});
		}
	}

	const closing = closingLine(announcement.closing);
	if (closing) {
		inner.push(separator);
		inner.push(text(closing));
	}

	if (options.buttons.length > 0) {
		inner.push({
			type: 1,
			components: options.buttons.slice(0, 5).map((button) => ({ type: 2, style: 5, label: button.label.slice(0, 80), url: button.url }))
		});
	}

	const components: Component[] = [];
	const ping = pingLine(options.roleId);
	if (ping) components.push(text(ping));
	components.push({ type: 17, accent_color: ACCENT_COLOR, components: inner });

	const characters = textLength(components);
	if (characters > COMPONENTS_TEXT_LIMIT) {
		throw new Error(`The Components V2 message has ${characters} text characters, over the ${COMPONENTS_TEXT_LIMIT} limit`);
	}

	return [
		{
			payload: {
				components,
				flags: MESSAGE_FLAGS.IsComponentsV2,
				allowed_mentions: allowedMentions(options.roleId),
				...identity(options)
			},
			files: options.images.map((image) => image.file)
		}
	];
}

/** Renders the format the agent chose, and falls back to plain text when a container would be too long. */
export function render(announcement: Announcement, options: RenderOptions): StoredMessage[] {
	if (announcement.format === 'components') {
		try {
			return renderComponents(announcement, options);
		} catch (error) {
			console.log(`${(error as Error).message}; falling back to plain text messages.`);
		}
	}
	return renderText(announcement, options);
}

function identity(options: RenderOptions): { username?: string; avatar_url?: string } {
	return {
		...(options.username ? { username: options.username } : {}),
		...(options.avatarUrl ? { avatar_url: options.avatarUrl } : {})
	};
}

/** Markdown the job summary shows to whoever approves the post. */
export function preview(messages: StoredMessage[]): string {
	const parts: string[] = [];
	for (const [index, message] of messages.entries()) {
		parts.push(`#### Message ${index + 1} of ${messages.length}`);
		const body = message.payload.content ?? flattenText(message.payload.components ?? []);
		parts.push(
			body
				.split('\n')
				.map((line) => `> ${line}`)
				.join('\n')
		);
		if (message.files.length) parts.push(`Attachments: ${message.files.map((file) => `\`${file}\``).join(', ')}`);
	}
	return parts.join('\n\n');
}

function flattenText(components: Component[]): string {
	const lines: string[] = [];
	for (const component of components) {
		if (component.type === 10 && typeof component.content === 'string') lines.push(component.content);
		if (component.type === 14) lines.push('---');
		if (component.type === 12) lines.push('[screenshots]');
		if (component.type === 1 && Array.isArray(component.components)) {
			for (const button of component.components as Component[]) lines.push(`[${String(button.label)}](${String(button.url)})`);
		}
		if (component.type === 17 && Array.isArray(component.components)) lines.push(flattenText(component.components as Component[]));
	}
	return lines.join('\n');
}
