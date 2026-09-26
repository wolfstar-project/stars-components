import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { createViteServer, ViteBuilder } from '../src/index.js';
import { fixture } from './helpers.js';

describe('standalone Vite integration', () => {
	test('builds without a vite.config and runs typed hooks', async () => {
		const f = await fixture();
		const before = vi.fn();
		const after = vi.fn();
		const close = vi.fn();
		const builder = new ViteBuilder(f.config, undefined, { beforeBuild: before, afterBuild: after, close });
		try {
			const first = builder.build();
			expect(builder.build()).toBe(first);
			expect((await first).ok).toBe(true);
			expect(await readFile(f.config.build.output, 'utf8')).toContain('x-stars');
			expect(before).toHaveBeenCalledTimes(1);
			expect(after).toHaveBeenCalledTimes(1);
			await Promise.all([builder.close(), builder.close()]);
			expect(close).toHaveBeenCalledTimes(1);
			await expect(builder.build()).rejects.toThrow('closed');
		} finally {
			await builder.close();
			await f.cleanup();
		}
	});
	test('reports dependency and hook failures as build outcomes', async () => {
		const f = await fixture();
		const builder = new ViteBuilder(f.config, {
			pluginRegistrations: () => ({}),
			importFromProject: async () => {
				throw new Error('missing Vite');
			}
		});
		try {
			const failure = vi.fn();
			builder.on('failure', failure);
			await expect(builder.build()).resolves.toMatchObject({ ok: false, message: 'missing Vite' });
			expect(failure).toHaveBeenCalledTimes(1);
		} finally {
			await builder.close();
			await f.cleanup();
		}
	});
	test('serves HTTP bodies, reloads source modules, and closes the socket', async () => {
		const f = await fixture();
		const server = await createViteServer(f.config);
		try {
			await server.listen(0);
			const address = server.vite.httpServer!.address() as AddressInfo;
			const url = `http://127.0.0.1:${address.port}/interactions`;
			const response = await fetch(url, { method: 'POST', body: '{"type":1}' });
			expect(response.headers.get('x-stars')).toBe('test');
			expect(await response.text()).toBe('{"type":1}');
			await writeFile(join(f.root, 'src/main.ts'), 'export default { fetch: () => new Response("updated") };');
			await vi.waitFor(async () => {
				expect(await (await fetch(url)).text()).toBe('updated');
			});
			await server.close();
			expect((await server.fetch(new Request(url))).status).toBe(503);
		} finally {
			await server.close();
			await f.cleanup();
		}
	});
	test('returns an HTTP error for invalid entries without exposing stack traces', async () => {
		const f = await fixture();
		await writeFile(join(f.root, 'src/main.ts'), 'export default {};');
		const server = await createViteServer(f.config);
		try {
			const response = await server.fetch(new Request('http://localhost/'));
			expect(response.status).toBe(500);
			expect(await response.text()).toBe('Internal Server Error');
		} finally {
			await server.close();
			await f.cleanup();
		}
	});
});
