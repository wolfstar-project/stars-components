import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

export const MESSAGE_FLAGS = {
	SuppressEmbeds: 1 << 2,
	IsComponentsV2: 1 << 15
} as const;

/** The limit for `content` on a plain message. */
export const CONTENT_LIMIT = 2000;
/** The limit for every text display of a Components V2 message, added up. */
export const COMPONENTS_TEXT_LIMIT = 4000;
/** Discord rejects a webhook upload above 10 MiB on a server without boosts. */
export const ATTACHMENT_LIMIT = 10 * 1024 * 1024;

export interface Component {
	type: number;
	[key: string]: unknown;
}

export interface DiscordPayload {
	content?: string;
	components?: Component[];
	flags?: number;
	allowed_mentions: { parse: string[]; roles?: string[] };
	username?: string;
	avatar_url?: string;
	attachments?: { id: number; filename: string; description?: string }[];
}

/** One message as `draft` stores it: the payload plus the names of its files in the output folder. */
export interface StoredMessage {
	payload: DiscordPayload;
	files: string[];
}

/**
 * Pings only the announced role. AI-written text may contain `@everyone`, a user
 * mention, or another role: none of them notify anyone.
 */
export function allowedMentions(roleId: string): DiscordPayload['allowed_mentions'] {
	return roleId ? { parse: [], roles: [roleId] } : { parse: [] };
}

export function pingLine(roleId: string): string {
	return roleId ? `New announcement for <@&${roleId}>:` : '';
}

export function textLength(components: Component[]): number {
	let total = 0;
	for (const component of components) {
		if (component.type === 10 && typeof component.content === 'string') total += component.content.length;
		if (Array.isArray(component.components)) total += textLength(component.components as Component[]);
	}
	return total;
}

export function countComponents(components: Component[]): number {
	let total = 0;
	for (const component of components) {
		total++;
		if (Array.isArray(component.components)) total += countComponents(component.components as Component[]);
	}
	return total;
}

/** Throws when Discord would reject the message. */
export function validate(message: StoredMessage): void {
	const { payload } = message;
	if (payload.flags !== undefined && (payload.flags & MESSAGE_FLAGS.IsComponentsV2) !== 0) {
		if (payload.content) throw new Error('A Components V2 message cannot carry content');
		const components = payload.components ?? [];
		const characters = textLength(components);
		if (characters > COMPONENTS_TEXT_LIMIT) throw new Error(`${characters} text characters, over the ${COMPONENTS_TEXT_LIMIT} limit`);
		const count = countComponents(components);
		if (count > 40) throw new Error(`${count} components, over the 40 limit`);
	} else {
		const length = payload.content?.length ?? 0;
		if (length === 0 && message.files.length === 0) throw new Error('Empty message');
		if (length > CONTENT_LIMIT) throw new Error(`${length} content characters, over the ${CONTENT_LIMIT} limit`);
	}
	if (message.files.length > 10) throw new Error('More than 10 attachments');
}

export interface WebhookOptions {
	webhookUrl: string;
	threadId?: string;
	fetch?: typeof fetch;
	sleep?: (ms: number) => Promise<void>;
}

export function webhookEndpoint(webhookUrl: string, threadId: string | undefined, components: boolean): URL {
	const url = new URL(webhookUrl);
	const discordHosts = new Set(['discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com']);
	if (url.protocol !== 'https:' || !discordHosts.has(url.hostname) || !url.pathname.startsWith('/api/webhooks/')) {
		throw new Error('The webhook URL is not a Discord webhook URL');
	}
	url.searchParams.set('wait', 'true');
	// Without this flag Discord drops the components of a webhook message without an error.
	if (components) url.searchParams.set('with_components', 'true');
	if (threadId) url.searchParams.set('thread_id', threadId);
	return url;
}

/** Sends the messages in order, waiting out rate limits. Returns the IDs of the messages Discord created. */
export async function sendMessages(messages: StoredMessage[], directory: string, options: WebhookOptions): Promise<string[]> {
	const send = options.fetch ?? fetch;
	const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
	const ids: string[] = [];

	for (const message of messages) {
		validate(message);
		const components = message.payload.components !== undefined;
		const url = webhookEndpoint(options.webhookUrl, options.threadId, components);

		for (let attempt = 0; ; attempt++) {
			const response = await send(url, { method: 'POST', ...(await requestBody(message, directory)), signal: AbortSignal.timeout(30_000) });
			if (response.ok) {
				const created = (await response.json()) as { id: string };
				ids.push(created.id);
				break;
			}
			if ((response.status === 429 || response.status >= 500) && attempt < 4) {
				const retryAfter = Number(
					(
						await response
							.clone()
							.json()
							.catch(() => ({}))
					).retry_after ?? 0
				);
				await sleep(Math.max(retryAfter * 1000, 1000 * 2 ** attempt));
				continue;
			}
			// The webhook URL holds its token: report the status and Discord's error, never the URL.
			throw new Error(`Discord answered ${response.status}: ${(await response.text()).slice(0, 500)}`);
		}
	}
	return ids;
}

async function requestBody(message: StoredMessage, directory: string): Promise<{ body: string | FormData; headers?: Record<string, string> }> {
	if (message.files.length === 0) {
		return { body: JSON.stringify(message.payload), headers: { 'content-type': 'application/json' } };
	}
	const form = new FormData();
	const payload: DiscordPayload = {
		...message.payload,
		attachments: message.files.map((file, index) => ({ id: index, filename: basename(file) }))
	};
	form.set('payload_json', JSON.stringify(payload));
	for (const [index, file] of message.files.entries()) {
		const data = await readFile(join(directory, file));
		form.set(`files[${index}]`, new Blob([data], { type: mimeType(file) }), basename(file));
	}
	return { body: form };
}

function mimeType(file: string): string {
	const extension = file.split('.').pop()?.toLowerCase();
	if (extension === 'png') return 'image/png';
	if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
	if (extension === 'gif') return 'image/gif';
	if (extension === 'webp') return 'image/webp';
	return 'application/octet-stream';
}

/**
 * Splits blocks of markdown into as few messages as possible under `limit`.
 * A block longer than the limit is split on line boundaries.
 */
export function chunkBlocks(blocks: string[], limit = CONTENT_LIMIT): string[] {
	const chunks: string[] = [];
	let current = '';
	const push = (piece: string) => {
		const joined = current ? `${current}\n\n${piece}` : piece;
		if (joined.length <= limit) {
			current = joined;
			return;
		}
		if (current) chunks.push(current);
		current = piece;
	};

	for (const block of blocks) {
		if (block.length <= limit) {
			push(block);
			continue;
		}
		for (const line of block.split('\n')) {
			const piece = line.length > limit ? `${line.slice(0, limit - 1)}…` : line;
			const joined = current ? `${current}\n${piece}` : piece;
			if (joined.length <= limit) current = joined;
			else {
				if (current) chunks.push(current);
				current = piece;
			}
		}
	}
	if (current) chunks.push(current);
	return chunks;
}
