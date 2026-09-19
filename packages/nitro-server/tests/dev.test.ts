import type { AddressInfo } from 'node:net';
import { createNitroServer } from '../src/index.js';
import { fixture } from './helpers.js';

test('native Nitro development dispatches Fetch requests without a production build', async () => {
	const f = await fixture(true);
	const server = await createNitroServer(f.config);
	try {
		await server.listen(0);
		const address = server.httpServer!.address() as AddressInfo;
		const response = await fetch(`http://127.0.0.1:${address.port}/interactions`, { method: 'POST', body: 'native-nitro' });
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('native-nitro');
	} finally {
		await server.close();
		await f.cleanup();
	}
}, 30000);
