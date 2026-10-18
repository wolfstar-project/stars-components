import { chmod, stat } from 'node:fs/promises';
import { createServer, type Server } from 'node:net';
import { join } from 'node:path';
import { loadStarsConfig, type ResolvedStarsConfig } from '@wolfstar/schema';
import { createBuilder } from '../src/builders/index.js';
import { DevService } from '../src/dev/dev-service.js';
import { checkDevDirectories, checkPortAvailability, localEndpoint, parseDevPort, prepareDevEndpoint } from '../src/dev/preflight.js';
import { createFixture, waitFor, type Fixture } from './helpers.js';

async function listen(server: Server, host = '127.0.0.1'): Promise<number> {
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, host, resolve);
	});
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('Expected a TCP address');
	return address.port;
}

async function close(server: Server): Promise<void> {
	if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

describe('development preflight', () => {
	let fixture: Fixture;
	let config: ResolvedStarsConfig;
	const servers: Server[] = [];
	beforeEach(async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'package.json': '{"type":"module"}',
			'stars.config.mjs': "export default { build: { tool: 'none' }, imports: false, env: false, dev: { typecheck: false } };"
		});
		config = await loadStarsConfig({ cwd: fixture.root, env: {} });
	});
	afterEach(async () => {
		await Promise.all(servers.splice(0).map(close));
		await fixture.cleanup();
	});
	function socket(): Server {
		const server = createServer();
		servers.push(server);
		return server;
	}
	function endpoint(port: number, host = '127.0.0.1'): ResolvedStarsConfig {
		return { ...config, dev: { ...config.dev, url: `http://${host}:${port}/interactions?test=/` } };
	}

	test('detects a real occupied socket and releases a successful probe before returning', async () => {
		const server = socket();
		const port = await listen(server);
		expect(await checkPortAvailability(port, '127.0.0.1')).toBe('in-use');
		await close(server);
		expect(await checkPortAvailability(port, '127.0.0.1')).toBe('available');
		await new Promise<void>((resolve, reject) => {
			server.once('error', reject);
			server.listen(port, '127.0.0.1', resolve);
		});
		expect(server.address()).toMatchObject({ port });
	});

	test('detects a wildcard bind conflict even when the advertised loopback address is free', async () => {
		const port = await listen(socket(), '127.0.0.2');
		expect(await checkPortAvailability(port, '127.0.0.1')).toBe('available');
		await expect(prepareDevEndpoint(endpoint(port), { policy: 'error' })).rejects.toMatchObject({ code: 'PORT_IN_USE' });
		const selected = await prepareDevEndpoint(endpoint(port), { policy: 'next' });
		expect(Number(selected?.dev.env.HTTP_PORT)).toBeGreaterThan(port);
		expect(await checkPortAvailability(Number(selected!.dev.env.HTTP_PORT), '0.0.0.0')).toBe('available');
	});

	test('honors an explicit HTTP_ADDRESS instead of assuming a wildcard listener', async () => {
		const port = await listen(socket(), '127.0.0.2');
		const configured = endpoint(port);
		const selected = await prepareDevEndpoint(
			{ ...configured, dev: { ...configured.dev, env: { HTTP_ADDRESS: '127.0.0.1' } } },
			{ policy: 'error' }
		);
		expect(selected?.dev.env.HTTP_PORT).toBe(String(port));
	});

	test('resolves HTTP_ADDRESS from expanded env-file values and dev overrides', async () => {
		const port = await listen(socket(), '127.0.0.2');
		await fixture.write('.env', 'BIND_IP=127.0.0.2\nHTTP_ADDRESS=${BIND_IP} # bind address\n');
		await expect(prepareDevEndpoint(endpoint(port), { policy: 'error' })).rejects.toMatchObject({ code: 'PORT_IN_USE' });
		const configured = endpoint(port);
		const selected = await prepareDevEndpoint({ ...configured, dev: { ...configured.dev, env: { BIND_IP: '127.0.0.1' } } }, { policy: 'error' });
		expect(selected?.dev.env.HTTP_PORT).toBe(String(port));
	});

	test('uses NITRO_HOST before HOST for a Nitro application', async () => {
		const port = await listen(socket(), '127.0.0.2');
		const configured = endpoint(port);
		const nitro = {
			...configured,
			experimental: { ...configured.experimental, enableNitro: true },
			dev: { ...configured.dev, env: { NITRO_HOST: '127.0.0.1', HOST: '127.0.0.2' } }
		};
		expect((await prepareDevEndpoint(nitro, { policy: 'error' }))?.dev.env.HTTP_PORT).toBe(String(port));
	});

	test('distinguishes an unavailable local address from an occupied port', async () => {
		await expect(checkPortAvailability(3000, '192.0.2.1')).rejects.toMatchObject({ code: 'PORT_CHECK_FAILED' });
	});

	test('checks bracketed IPv6 URLs against real IPv6 listeners', async (context) => {
		const server = socket();
		const port = await listen(server, '::1').catch((error: NodeJS.ErrnoException) => {
			if (error.code === 'EAFNOSUPPORT' || error.code === 'EADDRNOTAVAIL') context.skip();
			throw error;
		});
		expect(localEndpoint(`http://[::1]:${port}/health`)).toEqual({ host: '::1', port });
		await expect(prepareDevEndpoint(endpoint(port, '[::1]'), { policy: 'error' })).rejects.toMatchObject({ code: 'PORT_IN_USE' });
	});

	test('does not bind a remote endpoint', async () => {
		const remote = { ...config, dev: { ...config.dev, url: 'https://example.com/bot' } };
		const checkPort = vi.fn();
		expect(await prepareDevEndpoint(remote, { checkPort })).toBe(remote);
		expect(checkPort).not.toHaveBeenCalled();
	});

	test('allows the user to continue on an occupied port without changing the endpoint', async () => {
		const port = await listen(socket());
		const selectPort = vi.fn(async () => 'continue' as const);
		const result = await prepareDevEndpoint(endpoint(port), { interactive: true, selectPort });
		expect(result?.dev.url).toBe(`http://127.0.0.1:${port}/interactions?test=/`);
		expect(selectPort).toHaveBeenCalledOnce();
	});

	test('cancels before generated files are created', async () => {
		const port = await listen(socket());
		expect(await prepareDevEndpoint(endpoint(port), { interactive: true, selectPort: async () => 'cancel' })).toBeNull();
		await expect(stat(join(fixture.root, '.stars'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test.each(['next', 'prompt'] as const)('%s selects an available port and preserves the URL and original configuration', async (policy) => {
		const port = await listen(socket());
		const original = endpoint(port);
		const result = await prepareDevEndpoint(original, { policy, interactive: true, selectPort: async () => 'next' });
		const selected = Number(new URL(result!.dev.url!).port);
		expect(selected).toBeGreaterThan(port);
		expect(new URL(result!.dev.url!).pathname + new URL(result!.dev.url!).search).toBe('/interactions?test=/');
		expect(result?.dev.env).toMatchObject({ HTTP_PORT: String(selected), PORT: String(selected), NITRO_PORT: String(selected) });
		expect(original.dev.env).toEqual(config.dev.env);
		expect(original.dev.url).toBe(`http://127.0.0.1:${port}/interactions?test=/`);
		expect(await checkPortAvailability(selected, '127.0.0.1')).toBe('available');
	});

	test.each(['prompt', 'error'] as const)('%s fails without reading input when noninteractive', async (policy) => {
		const port = await listen(socket());
		const selectPort = vi.fn();
		await expect(prepareDevEndpoint(endpoint(port), { policy, interactive: false, selectPort })).rejects.toMatchObject({ code: 'PORT_IN_USE' });
		expect(selectPort).not.toHaveBeenCalled();
	});

	test('an explicit continue policy requires no prompt or bind probe', async () => {
		const checkPort = vi.fn();
		const result = await prepareDevEndpoint(endpoint(3000), { policy: 'continue', interactive: false, checkPort });
		expect(result?.dev.env.HTTP_PORT).toBe('3000');
		expect(checkPort).not.toHaveBeenCalled();
	});

	test.each([
		['http:', 80],
		['https:', 443]
	] as const)('preserves the effective default port for %s', async (protocol, port) => {
		const configured = { ...config, dev: { ...config.dev, url: `${protocol}//127.0.0.1:${port}/interactions?test=/` } };
		const result = await prepareDevEndpoint(configured, { policy: 'continue' });
		expect(result?.dev.env).toMatchObject({ HTTP_PORT: String(port), PORT: String(port), NITRO_PORT: String(port) });
		expect(localEndpoint(result!.dev.url!)).toEqual({ host: '127.0.0.1', port });
	});

	test('includes 65535 in the bounded search and stops at the TCP limit', async () => {
		const checkPort = vi.fn(async (port: number) => (port === 65535 ? 'available' : 'in-use'));
		const result = await prepareDevEndpoint(endpoint(65534), { policy: 'next', checkPort });
		expect(result?.dev.env.HTTP_PORT).toBe('65535');
		await expect(prepareDevEndpoint(endpoint(65535), { policy: 'next', checkPort: async () => 'in-use' })).rejects.toMatchObject({
			code: 'NO_AVAILABLE_PORT'
		});
	});

	test('stops after 100 alternatives instead of scanning the entire port range', async () => {
		const checkPort = vi.fn(async () => 'in-use' as const);
		await expect(prepareDevEndpoint(endpoint(3000), { policy: 'next', checkPort })).rejects.toMatchObject({ code: 'NO_AVAILABLE_PORT' });
		expect(checkPort).toHaveBeenLastCalledWith(3100, '127.0.0.1');
	});

	test('propagates bind errors instead of trying a succession of unusable ports', async () => {
		const checkPort = vi.fn(async () => {
			throw new Error('EACCES');
		});
		await expect(prepareDevEndpoint(endpoint(3000), { policy: 'next', checkPort })).rejects.toThrow('EACCES');
		expect(checkPort).toHaveBeenCalledOnce();
	});

	test('forwards --port to the actual child process without changing global port variables', async () => {
		await fixture.write(
			'src/main.js',
			'console.log(JSON.stringify([process.env.HTTP_PORT,process.env.PORT,process.env.NITRO_PORT]));setInterval(() => {}, 1000);'
		);
		const before = { HTTP_PORT: process.env.HTTP_PORT, PORT: process.env.PORT, NITRO_PORT: process.env.NITRO_PORT };
		const port = await listen(socket());
		const selected = await prepareDevEndpoint(config, { port, policy: 'next' });
		const service = new DevService(selected!, { builder: await createBuilder(selected!) });
		try {
			await service.start();
			const expected = JSON.stringify(Array(3).fill(selected!.dev.env.HTTP_PORT));
			await waitFor(() => service.logs.entries().some(({ text, source }) => source === 'app' && text === expected));
			expect({ HTTP_PORT: process.env.HTTP_PORT, PORT: process.env.PORT, NITRO_PORT: process.env.NITRO_PORT }).toEqual(before);
		} finally {
			await service.stop();
		}
	});

	test('checks a missing directory through its existing ancestor without creating files', async () => {
		await checkDevDirectories(config);
		await expect(stat(join(fixture.root, '.stars'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('reports a file blocking the generated directory', async () => {
		await fixture.write('.stars', 'blocked');
		await expect(checkDevDirectories(config)).rejects.toMatchObject({ code: 'DEV_DIRECTORY_UNWRITABLE' });
	});

	test('reports a file in an ancestor of the configured output directory', async () => {
		await fixture.write('blocked', 'file');
		await expect(
			checkDevDirectories({ ...config, build: { ...config.build, tool: 'tsdown', outDir: join(fixture.root, 'blocked/nested/dist') } })
		).rejects.toMatchObject({ code: 'DEV_DIRECTORY_UNWRITABLE' });
	});

	test.skipIf(process.getuid?.() === 0 || process.platform === 'win32')('reports directories that cannot be written', async () => {
		await fixture.write('.stars/keep', '');
		await chmod(join(fixture.root, '.stars'), 0o500);
		try {
			await expect(checkDevDirectories(config)).rejects.toMatchObject({ code: 'DEV_DIRECTORY_UNWRITABLE' });
		} finally {
			await chmod(join(fixture.root, '.stars'), 0o700);
		}
	});
});

describe('development port flag', () => {
	test.each(['1', '3000', '65535'])('accepts %s', (value) => expect(parseDevPort(value)).toBe(Number(value)));
	test.each(['0', '-1', '65536', '1.5', 'abc', '', ' 3000', '3e3'])('rejects %s', (value) => {
		expect(() => parseDevPort(value)).toThrow();
	});
});
