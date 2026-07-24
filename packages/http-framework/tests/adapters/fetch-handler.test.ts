import { createHandler } from '../../src/adapters/fetch/index.js';
import { HttpCodes } from '../../src/lib/api/HttpCodes.js';
import { ErrorMessages, Payloads } from '../../src/lib/utils/constants.js';
import { webcrypto } from 'node:crypto';
import { InteractionType } from 'discord-api-types/v10';
import { beforeAll, describe, expect, test } from 'vitest';
import { TestableClient } from '@wolfstar/http-framework-test-utils';

describe('createHandler', () => {
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

	async function post(path: string, body: string, headers: Record<string, string> = {}) {
		const handler = createHandler(client, { postPath: '/interactions' });
		return handler(
			new Request(`https://example.com${path}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', ...headers },
				body
			})
		);
	}

	test('GIVEN unknown path THEN returns 404', async () => {
		const response = await post('/other', '{}');
		expect(response.status).toBe(HttpCodes.NotFound);
		expect(await response.text()).toBe(ErrorMessages.NotFound);
	});

	test('GIVEN non-POST method THEN returns 405', async () => {
		const handler = createHandler(client, { postPath: '/interactions' });
		const response = await handler(new Request('https://example.com/interactions', { method: 'GET' }));
		expect(response.status).toBe(HttpCodes.MethodNotAllowed);
		expect(await response.text()).toBe(ErrorMessages.UnsupportedHttpMethod);
	});

	test('GIVEN missing signature headers THEN returns 401', async () => {
		const response = await post('/interactions', '{}');
		expect(response.status).toBe(HttpCodes.Unauthorized);
		expect(await response.text()).toBe(ErrorMessages.MissingSignatureInformation);
	});

	test('GIVEN invalid signature THEN returns 401', async () => {
		const response = await post('/interactions', '{}', {
			'x-signature-ed25519': '00'.repeat(64),
			'x-signature-timestamp': '1234567890'
		});
		expect(response.status).toBe(HttpCodes.Unauthorized);
		expect(await response.text()).toBe(ErrorMessages.InvalidSignature);
	});

	test('GIVEN valid Ping THEN returns Pong', async () => {
		const body = JSON.stringify({ type: InteractionType.Ping });
		const timestamp = String(Math.floor(Date.now() / 1000));
		const signature = await sign(body, timestamp);

		const response = await post('/interactions', body, {
			'x-signature-ed25519': signature,
			'x-signature-timestamp': timestamp
		});

		expect(response.status).toBe(HttpCodes.OK);
		expect(await response.text()).toBe(Payloads.Pong);
		expect(response.headers.get('content-type')).toContain('application/json');
	});
});
