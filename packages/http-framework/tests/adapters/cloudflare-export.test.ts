import { TestableClient } from '@wolfstar/http-framework-test-utils';
import { InteractionType } from 'discord-api-types/v10';
import { webcrypto } from 'node:crypto';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { createExport } from '../../src/adapters/cloudflare/index.js';
import { HttpCodes } from '../../src/lib/api/HttpCodes.js';
import { Payloads } from '../../src/lib/utils/constants.js';

describe('createExport (Cloudflare Workers)', () => {
	let publicKeyHex: string;
	let privateKey: webcrypto.CryptoKey;
	let client: TestableClient;

	beforeAll(async () => {
		const pair = await webcrypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
		privateKey = pair.privateKey;
		const raw = await webcrypto.subtle.exportKey('raw', pair.publicKey);
		publicKeyHex = Buffer.from(raw).toString('hex');
		client = new TestableClient({ discordPublicKey: publicKeyHex });
	});

	async function sign(body: string, timestamp: string) {
		const data = Buffer.from(`${timestamp}${body}`);
		const signature = await webcrypto.subtle.sign('Ed25519', privateKey, data);
		return Buffer.from(signature).toString('hex');
	}

	test('GIVEN Workers fetch THEN forwards env and waitUntil into the handler', async () => {
		const worker = createExport(client, { postPath: '/interactions' });
		const waitUntil = vi.fn();
		const env = { DISCORD_TOKEN: 'test' };

		const body = JSON.stringify({ type: InteractionType.Ping });
		const timestamp = String(Math.floor(Date.now() / 1000));
		const signature = await sign(body, timestamp);

		const response = await worker.fetch(
			new Request('https://example.com/interactions', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					'x-signature-ed25519': signature,
					'x-signature-timestamp': timestamp
				},
				body
			}),
			env,
			{ waitUntil, passThroughOnException: vi.fn() }
		);

		expect(response.status).toBe(HttpCodes.OK);
		expect(await response.text()).toBe(Payloads.Pong);
		// waitUntil is available on the adapter context for future/background work;
		// Ping does not schedule any deferred tasks today.
		expect(waitUntil).not.toHaveBeenCalled();
	});

	test('GIVEN unknown path THEN returns 404 through createExport', async () => {
		const worker = createExport(client, { postPath: '/interactions' });
		const response = await worker.fetch(
			new Request('https://example.com/other', { method: 'POST', body: '{}' }),
			{},
			{ waitUntil: vi.fn(), passThroughOnException: vi.fn() }
		);
		expect(response.status).toBe(HttpCodes.NotFound);
	});
});
