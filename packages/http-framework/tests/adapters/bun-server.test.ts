import { TestableClient } from '@wolfstar/http-framework-test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createServer } from '../../src/adapters/bun/index.js';

describe('createServer (Bun)', () => {
	const serveMock = vi.fn((options: { fetch: (request: Request) => Promise<Response> }) => ({
		hostname: null,
		port: 3000,
		options,
		stop: vi.fn()
	}));

	beforeEach(() => {
		serveMock.mockClear();
		vi.stubGlobal('Bun', { serve: serveMock });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test('GIVEN port options THEN wires Bun.serve with createHandler fetch', () => {
		const client = new TestableClient();
		const server = createServer(client, { port: 3000, postPath: '/interactions' });

		expect(serveMock).toHaveBeenCalledOnce();
		const options = serveMock.mock.calls[0]![0];
		expect(options).toMatchObject({ port: 3000 });
		expect(typeof options.fetch).toBe('function');
		expect(server).toEqual(expect.objectContaining({ stop: expect.any(Function) }));
		expect(options).not.toHaveProperty('postPath');
	});

	test('GIVEN unix options THEN uses unix Bun.serve overload', () => {
		const client = new TestableClient();
		createServer(client, { unix: '/tmp/http-framework.sock', postPath: '/interactions' });

		expect(serveMock).toHaveBeenCalledOnce();
		expect(serveMock.mock.calls[0]![0]).toMatchObject({ unix: '/tmp/http-framework.sock' });
	});

	test('GIVEN Bun runtime missing THEN throws', () => {
		vi.stubGlobal('Bun', undefined);
		const client = new TestableClient();
		expect(() => createServer(client, { port: 3000 })).toThrow(/Bun\.serve is not available/);
	});
});
