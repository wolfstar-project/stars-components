import type { AddressInfo } from 'node:net';
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
