import { writeFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { createNitroServer } from '../src/index.js';
import { fixture } from './helpers.js';

test('native Nitro development dispatches Fetch requests without a production build', async () => {
	const f = await fixture(true);
	const server = await createNitroServer(f.config);
	try {
		await server.listen(0);
		const address = server.vite.httpServer!.address() as AddressInfo;
		const response = await fetch(`http://127.0.0.1:${address.port}/interactions`, { method: 'POST', body: 'native-nitro' });
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('native-nitro');
	} finally {
		await server.close();
		await f.cleanup();
	}
}, 30000);

test('dispatches through Nitro directly, without a listening socket, and closes cleanly', async () => {
	const f = await fixture(true);
	const server = await createNitroServer(f.config);
	try {
		const response = await server.fetch(new Request('http://localhost/interactions', { method: 'POST', body: 'in-process' }));
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('in-process');
		await server.close();
		expect((await server.fetch(new Request('http://localhost/interactions'))).status).toBe(503);
		// Nitro's own watchers/hooks are only released by nitro.close(); this must not hang or throw.
		await server.close();
	} finally {
		await server.close();
		await f.cleanup();
	}
}, 30000);

test('binds to NITRO_HOST, then HOST, from dev.env, falling back to the hostname of dev.url', async () => {
	const f = await fixture(true);
	const hostOf = async (env: Record<string, string>, vite: object = { server: { port: 0 } }) => {
		const server = await createNitroServer({ ...f.config, vite, dev: { ...f.config.dev, env } });
		try {
			return server.vite.config.server.host;
		} finally {
			await server.close();
		}
	};
	try {
		expect(await hostOf({})).toBe('localhost');
		expect(await hostOf({ HOST: '127.0.0.2' })).toBe('127.0.0.2');
		expect(await hostOf({ NITRO_HOST: '127.0.0.3', HOST: '127.0.0.2' })).toBe('127.0.0.3');
		expect(await hostOf({ NITRO_HOST: '', HOST: '[::1]' })).toBe('::1');
		// An explicit vite.server.host is the user's own choice and stays in charge.
		expect(await hostOf({ NITRO_HOST: '127.0.0.3' }, { server: { host: '127.0.0.4', port: 0 } })).toBe('127.0.0.4');
	} finally {
		await f.cleanup();
	}
}, 60000);

test('answers unhandled entry errors as JSON, never an HTML error page', async () => {
	const f = await fixture(true);
	await writeFile(join(f.root, 'src/main.ts'), 'export default { fetch: () => { throw new Error("boom"); } };');
	const server = await createNitroServer(f.config);
	try {
		const response = await server.fetch(new Request('http://localhost/interactions'));
		expect(response.status).toBe(500);
		expect(response.headers.get('content-type')).toContain('application/json');
		// Nitro's defaultHandler keeps the real message out of `message` (a generic error name goes
		// there instead) and puts it as the first `stack` line in dev; assert on that shape instead
		// of a message string that is deliberately not the thrown error's text.
		const body = (await response.json()) as { error?: boolean; stack?: string[] };
		expect(body.error).toBe(true);
		expect(body.stack?.[0]).toContain('boom');
	} finally {
		await server.close();
		await f.cleanup();
	}
}, 30000);
