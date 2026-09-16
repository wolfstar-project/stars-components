import type { loadEnvFiles as LoadEnvFiles } from '../src/lib/env-loader';

const { requireMock } = vi.hoisted(() => ({ requireMock: vi.fn() }));

vi.mock('node:module', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:module')>();
	return { ...actual, createRequire: () => requireMock };
});

describe('Varlock loader (experimental)', () => {
	const addedKeys = new Set<string>();
	let loadEnvFiles: typeof LoadEnvFiles;

	beforeEach(async () => {
		process.env.NODE_ENV = 'development';
		requireMock.mockReset();

		// The workspace vitest config runs with `isolate: false`, so the module registry is shared across test
		// files. A prior file may have already imported `env-loader.ts` bound to the real `node:module`, so it
		// must be re-imported fresh here to pick up the `createRequire` mock registered above.
		vi.resetModules();
		({ loadEnvFiles } = await import('../src/lib/env-loader'));
	});

	afterEach(() => {
		for (const key of addedKeys) delete process.env[key];
		addedKeys.clear();
	});

	function setEnv(key: string, value: string) {
		process.env[key] = value;
		addedKeys.add(key);
	}

	test('should throw a friendly error when the optional `varlock` package is not installed', () => {
		requireMock.mockImplementation(() => {
			const error = new Error("Cannot find package 'varlock'") as NodeJS.ErrnoException;
			error.code = 'MODULE_NOT_FOUND';
			throw error;
		});

		expect(() => loadEnvFiles({ loader: 'varlock' })).toThrow(/optional `varlock` package is not installed/);
	});

	test('should rethrow errors unrelated to a missing package', () => {
		requireMock.mockImplementation(() => {
			throw new Error('boom');
		});

		expect(() => loadEnvFiles({ loader: 'varlock' })).toThrow('boom');
	});

	test('should diff `process.env` and report the keys resolved by varlock, excluding internal keys', () => {
		requireMock.mockImplementation(() => {
			setEnv('MY_APP_SETTING', 'FOO');
			setEnv('__VARLOCK_ENV', '{"some":"blob"}');
			setEnv('_VARLOCK_ENV_KEY', 'secret');
		});

		const output = loadEnvFiles({ loader: 'varlock' });

		expect(output.parsed).toEqual({ MY_APP_SETTING: 'FOO' });
	});

	test('should filter resolved keys by `prefix`', () => {
		requireMock.mockImplementation(() => {
			setEnv('MY_APP_SETTING', 'FOO');
			setEnv('NOT_MY_SETTING', 'BAR');
		});

		const output = loadEnvFiles({ loader: 'varlock', prefix: 'MY_APP_' });

		expect(output.parsed).toEqual({ MY_APP_SETTING: 'FOO' });
	});
});
