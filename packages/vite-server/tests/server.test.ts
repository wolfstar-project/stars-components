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
	test('binds to the HTTP_ADDRESS of dev.env, falling back to the hostname of dev.url', async () => {
		const f = await fixture();
		const hostOf = async (env: Record<string, string>, vite: object = { server: { port: 0 } }) => {
			const server = await createViteServer({ ...f.config, vite, dev: { ...f.config.dev, env } });
			try {
				return server.vite.config.server.host;
			} finally {
				await server.close();
			}
		};
		try {
			expect(await hostOf({})).toBe('localhost');
			expect(await hostOf({ HTTP_ADDRESS: '' })).toBe('localhost');
			expect(await hostOf({ HTTP_ADDRESS: '127.0.0.2' })).toBe('127.0.0.2');
			expect(await hostOf({ HTTP_ADDRESS: '[::1]' })).toBe('::1');
			// An explicit vite.server.host is the user's own choice and stays in charge.
			expect(await hostOf({ HTTP_ADDRESS: '127.0.0.2' }, { server: { host: '127.0.0.3', port: 0 } })).toBe('127.0.0.3');
		} finally {
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
