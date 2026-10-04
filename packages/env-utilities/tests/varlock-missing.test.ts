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

	/** Everything resolves and loads through the real `require`, except the packages in `missing`. */
	async function withMissing(...missing: string[]) {
		const { createRequire } = await vi.importActual<typeof import('node:module')>('node:module');
		const real = createRequire(import.meta.url);
		const notFound = (id: string) => Object.assign(new Error(`Cannot find package '${id}'`), { code: 'MODULE_NOT_FOUND' });
		requireMock.mockImplementation((id: string) => {
			if (missing.some((name) => id === name || id.startsWith(`${name}/`))) throw notFound(id);
			return real(id);
		});
		requireMock.resolve = vi.fn((id: string) => {
			if (missing.some((name) => id === name || id.startsWith(`${name}/`))) throw notFound(id);
			return real.resolve(id);
		});
	}

	function inProject(name: string) {
		vi.spyOn(process, 'cwd').mockReturnValue(fileURLToPath(new URL(`./varlock-fixtures/detect/${name}`, import.meta.url)));
	}

	test('should use dotenv when a schema is found but `varlock` is not installed', async () => {
		await withMissing('varlock');
		inProject('src-schema');

		const loadEnvFiles = await load();
		try {
			expect(loadEnvFiles().parsed).toEqual({ VARLOCK_TEST_SOURCE: 'dotenv' });
			expect(requireMock).toHaveBeenCalledWith('dotenv');
		} finally {
			delete process.env.VARLOCK_TEST_SOURCE;
		}
	});

	test('should fall back to the node loader when neither `varlock` nor `dotenv` is installed', async () => {
		await withMissing('varlock', 'dotenv', 'dotenv-expand');
		inProject('src-schema');

		const loadEnvFiles = await load();
		try {
			expect(loadEnvFiles().parsed).toEqual({ VARLOCK_TEST_SOURCE: 'dotenv' });
			expect(requireMock).not.toHaveBeenCalledWith('dotenv');
		} finally {
			delete process.env.VARLOCK_TEST_SOURCE;
		}
	});

	test('should use the node loader without a schema when `dotenv-expand` is missing', async () => {
		await withMissing('varlock', 'dotenv-expand');
		inProject('none');

		const loadEnvFiles = await load();
		try {
			expect(loadEnvFiles().parsed).toEqual({ VARLOCK_TEST_SOURCE: 'dotenv' });
			expect(requireMock).not.toHaveBeenCalledWith('dotenv');
		} finally {
			delete process.env.VARLOCK_TEST_SOURCE;
		}
	});

	test('should throw a friendly error when the dotenv loader runs without `dotenv`', async () => {
		requireMock.mockImplementation(() => {
			const error = new Error("Cannot find package 'dotenv'") as NodeJS.ErrnoException;
			error.code = 'MODULE_NOT_FOUND';
			throw error;
		});

		const loadEnvFiles = await load();
		expect(() => loadEnvFiles({ loader: 'dotenv' })).toThrow(/needs the `dotenv` package/);
	});

	test('should name `dotenv-expand` when only that package is missing', async () => {
		const { createRequire } = await vi.importActual<typeof import('node:module')>('node:module');
		const real = createRequire(import.meta.url);
		requireMock.mockImplementation((id: string) => {
			if (id !== 'dotenv-expand') return real(id);
			throw Object.assign(new Error("Cannot find package 'dotenv-expand'"), { code: 'MODULE_NOT_FOUND' });
		});

		const loadEnvFiles = await load();
		expect(() => loadEnvFiles({ loader: 'dotenv' })).toThrow(/needs the `dotenv-expand` package/);
	});

	test('should not require `dotenv` for the varlock loader', async () => {
		requireMock.mockImplementation((id: string) => {
			if (id.startsWith('dotenv')) throw new Error(`unexpected require of ${id}`);
			throw Object.assign(new Error('stop here'), { code: 'STOP' });
		});

		const loadEnvFiles = await load();
		expect(() => loadEnvFiles({ loader: 'varlock' })).toThrow('stop here');
	});

	test('should rethrow errors unrelated to a missing package', async () => {
		requireMock.mockImplementation(() => {
			throw new Error('boom');
		});

		const loadEnvFiles = await load();
		expect(() => loadEnvFiles({ loader: 'varlock' })).toThrow('boom');
	});
});
