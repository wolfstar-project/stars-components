import { webcrypto } from 'node:crypto';
import { InteractionType } from 'discord-api-types/v10';
import { createFetchHandler } from '../src/fetch.js';
import { Client } from '../src/lib/Client.js';

async function generateDiscordKeyPair() {
	const { publicKey, privateKey } = (await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
	const raw = Buffer.from(await webcrypto.subtle.exportKey('raw', publicKey));
	return { publicKeyHex: raw.toString('hex'), privateKey };
}

async function sign(privateKey: CryptoKey, timestamp: string, body: string): Promise<string> {
	const data = Buffer.from(`${timestamp}${body}`);
	const signature = await webcrypto.subtle.sign('Ed25519', privateKey, data);
	return Buffer.from(signature).toString('hex');
}

describe('createFetchHandler', () => {
	test('verifies the signature and replies to a Ping the same way listen() does', async () => {
		const { publicKeyHex, privateKey } = await generateDiscordKeyPair();
		const client = new Client({ id: '1', discordToken: 'x', discordPublicKey: publicKeyHex });
		const handler = await createFetchHandler(client, { discordPublicKey: publicKeyHex, postPath: '/interactions' });

		const timestamp = String(Math.floor(Date.now() / 1000));
		const body = JSON.stringify({ type: InteractionType.Ping });
		const signature = await sign(privateKey, timestamp, body);

		const response = await handler(
			new Request('http://localhost/interactions', {
				method: 'POST',
				headers: { 'x-signature-ed25519': signature, 'x-signature-timestamp': timestamp, 'content-type': 'application/json' },
				body
			})
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ type: 1 });
		expect(response.headers.get('content-type')).toBe('application/json');
	});

	test('rejects a bad signature the same way listen() does', async () => {
		const { publicKeyHex } = await generateDiscordKeyPair();
		const client = new Client({ id: '1', discordToken: 'x', discordPublicKey: publicKeyHex });
		const handler = await createFetchHandler(client, { discordPublicKey: publicKeyHex, postPath: '/interactions' });

		const response = await handler(
			new Request('http://localhost/interactions', {
				method: 'POST',
				headers: { 'x-signature-ed25519': '00'.repeat(64), 'x-signature-timestamp': '0' },
				body: JSON.stringify({ type: InteractionType.Ping })
			})
		);

		expect(response.status).toBe(401);
	});

	test('404s outside the configured path, 405s on the wrong method', async () => {
		const { publicKeyHex } = await generateDiscordKeyPair();
		const client = new Client({ id: '1', discordToken: 'x', discordPublicKey: publicKeyHex });
		const handler = await createFetchHandler(client, { discordPublicKey: publicKeyHex, postPath: '/interactions' });

		expect((await handler(new Request('http://localhost/nope', { method: 'POST' }))).status).toBe(404);
		expect((await handler(new Request('http://localhost/interactions', { method: 'GET' }))).status).toBe(405);
	});
});
