import { fileURLToPath } from 'node:url';

const { requireMock } = vi.hoisted(() => ({ requireMock: vi.fn() }));

vi.mock('node:module', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:module')>();
	return { ...actual, createRequire: () => requireMock };
});

describe('Varlock loader without the optional package', () => {
	beforeEach(() => {
		process.env.NODE_ENV = 'development';
		requireMock.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	afterAll(() => {
		// Shared module registry (`isolate: false`): do not leak the mock into the other test files.
		vi.doUnmock('node:module');
		vi.resetModules();
	});

	async function load() {
		// The workspace vitest config runs with `isolate: false`, so a prior file may have imported `env-loader.ts`
		// bound to the real `node:module`: import it fresh to pick up the `createRequire` mock above.
		vi.resetModules();
		return (await import('../src/lib/env-loader')).loadEnvFiles;
	}

	test('should throw a friendly error when `varlock` is not installed', async () => {
		requireMock.mockImplementation(() => {
			const error = new Error("Cannot find package 'varlock'") as NodeJS.ErrnoException;
			error.code = 'MODULE_NOT_FOUND';
			throw error;
		});

		const loadEnvFiles = await load();
		expect(() => loadEnvFiles({ loader: 'varlock' })).toThrow(/optional `varlock` package is not installed/);
	});

	test('should keep dotenv when a schema is found but `varlock` is not installed', async () => {
		requireMock.resolve = vi.fn(() => {
			throw Object.assign(new Error("Cannot find package 'varlock'"), { code: 'MODULE_NOT_FOUND' });
		});
		vi.spyOn(process, 'cwd').mockReturnValue(fileURLToPath(new URL('./varlock-fixtures/detect/src-schema', import.meta.url)));

		const loadEnvFiles = await load();
		try {
			expect(loadEnvFiles().parsed).toEqual({ VARLOCK_TEST_SOURCE: 'dotenv' });
		} finally {
			delete process.env.VARLOCK_TEST_SOURCE;
		}
	});

	test('should rethrow errors unrelated to a missing package', async () => {
		requireMock.mockImplementation(() => {
			throw new Error('boom');
		});

		const loadEnvFiles = await load();
		expect(() => loadEnvFiles({ loader: 'varlock' })).toThrow('boom');
	});
});
