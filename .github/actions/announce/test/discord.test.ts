import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { chunkBlocks, sendMessages, webhookEndpoint } from '../src/discord.ts';
import { createNotifier, sign } from '../src/notify.ts';

const WEBHOOK = 'https://discord.com/api/webhooks/1/token';

describe('webhook delivery', () => {
	it('adds with_components only for component messages', () => {
		assert.equal(webhookEndpoint(WEBHOOK, undefined, true).search, '?wait=true&with_components=true');
		assert.equal(webhookEndpoint(WEBHOOK, '99', false).search, '?wait=true&thread_id=99');
		assert.throws(() => webhookEndpoint('https://example.com/api/webhooks/1/t', undefined, false), /not a Discord webhook/);
	});

	it('waits out a rate limit and uploads attachments as multipart', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'announce-'));
		await writeFile(join(directory, 'after-1.png'), Buffer.from([0x89, 0x50]));
		const calls: { body: unknown }[] = [];
		const waits: number[] = [];
		const responses = [
			new Response(JSON.stringify({ retry_after: 2 }), { status: 429 }),
			new Response(JSON.stringify({ id: '555' }), { status: 200 })
		];
		const ids = await sendMessages([{ payload: { content: 'hi', allowed_mentions: { parse: [] } }, files: ['after-1.png'] }], directory, {
			webhookUrl: WEBHOOK,
			fetch: async (_url, init) => {
				calls.push({ body: init?.body });
				return responses.shift()!;
			},
			sleep: async (ms) => {
				waits.push(ms);
			}
		});
		assert.deepEqual(ids, ['555']);
		assert.deepEqual(waits, [2000]);
		const form = calls[1]!.body as FormData;
		assert.ok(form instanceof FormData);
		assert.deepEqual(JSON.parse(form.get('payload_json') as string).attachments, [{ id: 0, filename: 'after-1.png' }]);
		assert.ok(form.get('files[0]') instanceof Blob);
	});

	it('never puts the webhook URL in an error', async () => {
		await assert.rejects(
			sendMessages([{ payload: { content: 'hi', allowed_mentions: { parse: [] } }, files: [] }], '.', {
				webhookUrl: WEBHOOK,
				fetch: async () => new Response('{"message":"Unknown Webhook"}', { status: 404 })
			}),
			(error: Error) => !error.message.includes('token') && error.message.includes('404')
		);
	});

	it('chunks blocks under the limit', () => {
		assert.deepEqual(chunkBlocks(['a'.repeat(6), 'b'.repeat(6)], 10), ['aaaaaa', 'bbbbbb']);
		assert.deepEqual(chunkBlocks(['ab', 'cd'], 10), ['ab\n\ncd']);
		assert.ok(chunkBlocks([`${'x'.repeat(8)}\n${'y'.repeat(8)}`], 10).every((chunk) => chunk.length <= 10));
	});
});

describe('signed release callbacks', () => {
	it('signs timestamp.body with HMAC-SHA256 and retries a 5xx', async () => {
		const requests: { headers: Record<string, string>; body: string }[] = [];
		const statuses = [503, 200];
		const notify = createNotifier({
			url: 'https://hooks.example/release',
			secret: 's3cret',
			mode: 'bot',
			repository: 'o/r',
			fetch: async (_url, init) => {
				requests.push({ headers: init!.headers as Record<string, string>, body: init!.body as string });
				return new Response(null, { status: statuses.shift()! });
			},
			sleep: async () => {}
		});
		await notify('drafted', { version: 'v1' });
		assert.equal(requests.length, 2);
		const [first] = requests;
		const timestamp = first!.headers['x-release-timestamp']!;
		assert.equal(first!.headers['x-release-signature-256'], sign('s3cret', timestamp, first!.body));
		assert.equal(JSON.parse(first!.body).event, 'drafted');
		assert.equal(JSON.parse(first!.body).sequence, 1);
	});

	it('is off without both URL and secret, or without HTTPS', async () => {
		let called = false;
		const fetch = async () => {
			called = true;
			return new Response(null);
		};
		await createNotifier({ url: 'https://x.example', mode: 'bot', repository: 'o/r', fetch })('started');
		await createNotifier({ url: 'http://x.example', secret: 's', mode: 'bot', repository: 'o/r', fetch })('started');
		assert.equal(called, false);
	});
});
