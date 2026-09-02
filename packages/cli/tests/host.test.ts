const lookup = vi.fn();

vi.mock('node:dns/promises', () => ({ lookup: (...args: unknown[]) => lookup(...args) }));

const { resolveLocalhost, withResolvedLocalhost } = await import('../src/lib/host.js');

describe('resolveLocalhost', () => {
	beforeEach(() => {
		lookup.mockReset();
	});

	test('keeps `localhost` when the default and verbatim DNS results agree', async () => {
		lookup.mockResolvedValue({ address: '127.0.0.1', family: 4 });
		await expect(resolveLocalhost()).resolves.toBe('localhost');
	});

	test('prefers the OS-order address when it disagrees with the default lookup', async () => {
		lookup.mockImplementation((_host: string, options?: { verbatim?: boolean }) =>
			Promise.resolve(options?.verbatim ? { address: '::1', family: 6 } : { address: '127.0.0.1', family: 4 })
		);
		await expect(resolveLocalhost()).resolves.toBe('::1');
	});

	test('falls back to `localhost` when the lookup fails', async () => {
		lookup.mockRejectedValue(new Error('no dns'));
		await expect(resolveLocalhost()).resolves.toBe('localhost');
	});
});

describe('withResolvedLocalhost', () => {
	beforeEach(() => {
		lookup.mockReset();
	});

	test('leaves non-localhost hosts untouched without looking anything up', async () => {
		await expect(withResolvedLocalhost('http://192.168.1.5:3000/')).resolves.toBe('http://192.168.1.5:3000/');
		expect(lookup).not.toHaveBeenCalled();
	});

	test('leaves the URL untouched when localhost resolves consistently', async () => {
		lookup.mockResolvedValue({ address: '127.0.0.1', family: 4 });
		await expect(withResolvedLocalhost('http://localhost:3000/')).resolves.toBe('http://localhost:3000/');
	});

	test('rewrites the hostname to the resolved IPv4 address', async () => {
		lookup.mockImplementation((_host: string, options?: { verbatim?: boolean }) =>
			Promise.resolve(options?.verbatim ? { address: '127.0.0.2', family: 4 } : { address: '127.0.0.1', family: 4 })
		);
		await expect(withResolvedLocalhost('http://localhost:3000/health')).resolves.toBe('http://127.0.0.2:3000/health');
	});

	test('brackets a resolved IPv6 address', async () => {
		lookup.mockImplementation((_host: string, options?: { verbatim?: boolean }) =>
			Promise.resolve(options?.verbatim ? { address: '::1', family: 6 } : { address: '127.0.0.1', family: 4 })
		);
		await expect(withResolvedLocalhost('http://localhost:3000/')).resolves.toBe('http://[::1]:3000/');
	});
});
