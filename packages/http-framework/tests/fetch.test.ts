import { webcrypto } from 'node:crypto';
import { InteractionType } from 'discord-api-types/v10';
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

describe('Client#fetch', () => {
	test('verifies the signature and replies to a Ping the same way listen() does', async () => {
		const { publicKeyHex, privateKey } = await generateDiscordKeyPair();
		const client = new Client({ clientId: '1', discordToken: 'x', discordPublicKey: publicKeyHex });

		const timestamp = String(Math.floor(Date.now() / 1000));
		const body = JSON.stringify({ type: InteractionType.Ping });
		const signature = await sign(privateKey, timestamp, body);

		const response = await client.fetch(
			new Request('http://localhost/interactions', {
				method: 'POST',
				headers: { 'x-signature-ed25519': signature, 'x-signature-timestamp': timestamp, 'content-type': 'application/json' },
				body
			}),
			{ postPath: '/interactions' }
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ type: 1 });
		expect(response.headers.get('content-type')).toBe('application/json');
	});

	test('rejects a bad signature the same way listen() does', async () => {
		const { publicKeyHex } = await generateDiscordKeyPair();
		const client = new Client({ clientId: '1', discordToken: 'x', discordPublicKey: publicKeyHex });

		const response = await client.fetch(
			new Request('http://localhost/interactions', {
				method: 'POST',
				headers: { 'x-signature-ed25519': '00'.repeat(64), 'x-signature-timestamp': '0' },
				body: JSON.stringify({ type: InteractionType.Ping })
			}),
			{ postPath: '/interactions' }
		);

		expect(response.status).toBe(401);
	});

	test('404s outside the configured path, 405s on the wrong method', async () => {
		const { publicKeyHex } = await generateDiscordKeyPair();
		const client = new Client({ clientId: '1', discordToken: 'x', discordPublicKey: publicKeyHex });

		expect((await client.fetch(new Request('http://localhost/nope', { method: 'POST' }), { postPath: '/interactions' })).status).toBe(404);
		expect((await client.fetch(new Request('http://localhost/interactions', { method: 'GET' }), { postPath: '/interactions' })).status).toBe(405);
	});

	test('reuses the same imported key across calls', async () => {
		const { publicKeyHex, privateKey } = await generateDiscordKeyPair();
		const client = new Client({ clientId: '1', discordToken: 'x', discordPublicKey: publicKeyHex });

		for (let i = 0; i < 2; i++) {
			const timestamp = String(Math.floor(Date.now() / 1000));
			const body = JSON.stringify({ type: InteractionType.Ping });
			const signature = await sign(privateKey, timestamp, body);

			const response = await client.fetch(
				new Request('http://localhost/interactions', {
					method: 'POST',
					headers: { 'x-signature-ed25519': signature, 'x-signature-timestamp': timestamp, 'content-type': 'application/json' },
					body
				}),
				{ postPath: '/interactions' }
			);

			expect(response.status).toBe(200);
		}
	});
});
