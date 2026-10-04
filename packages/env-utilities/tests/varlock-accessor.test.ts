import { fileURLToPath } from 'node:url';
import type { loadEnvFiles as LoadEnvFiles } from '../src/lib/env-loader';

const fixture = fileURLToPath(new URL('./varlock-fixtures/valid', import.meta.url));

describe('Typed `env` accessor', () => {
	let loadEnvFiles: typeof LoadEnvFiles;

	beforeAll(async () => {
		// The workspace vitest config runs with `isolate: false`: make sure `env-loader.ts` is not bound to a mocked
		// `node:module` left over by another test file.
		vi.doUnmock('node:module');
		vi.resetModules();
		({ loadEnvFiles } = await import('../src/lib/env-loader'));
	});

	afterEach(() => {
		for (const key of Object.keys(process.env)) if (key.startsWith('VARLOCK_TEST_')) delete process.env[key];
		delete (globalThis as { __varlockLoadedEnv?: unknown }).__varlockLoadedEnv;
	});

	test('should expose the values already coerced by varlock once the loader has run', async () => {
		process.env.NODE_ENV = 'development';
		loadEnvFiles({ loader: 'varlock', path: fixture });

		const { env } = (await import('../src/varlock')) as { env: Record<string, unknown> };

		expect(env.VARLOCK_TEST_PORT).toBe(6379);
		expect(env.VARLOCK_TEST_ENABLED).toBe(true);
		expect(env.VARLOCK_TEST_HOST).toBe('localhost');
	});
});
