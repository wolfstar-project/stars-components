import { fileURLToPath } from 'node:url';
import type { loadEnvFiles as LoadEnvFiles } from '../src/lib/env-loader';

const fixture = (name: string) => fileURLToPath(new URL(`./varlock-fixtures/${name}`, import.meta.url));

describe('Varlock loader (experimental)', () => {
	const touched = new Set<string>();
	const original = { ...process.env };

	let loadEnvFiles: typeof LoadEnvFiles;

	beforeAll(async () => {
		// The workspace vitest config runs with `isolate: false`: make sure `env-loader.ts` is not bound to a mocked
		// `node:module` left over by another test file.
		vi.doUnmock('node:module');
		vi.resetModules();
		({ loadEnvFiles } = await import('../src/lib/env-loader'));
	});

	beforeEach(() => {
		process.env.NODE_ENV = 'development';
	});

	afterEach(() => {
		for (const key of Object.keys(process.env)) {
			if (key.startsWith('VARLOCK_TEST_') || key === '__VARLOCK_ENV') delete process.env[key];
		}

		for (const key of touched) {
			if (original[key] === undefined) delete process.env[key];
			else process.env[key] = original[key];
		}

		touched.clear();
		delete (globalThis as { __varlockLoadedEnv?: unknown }).__varlockLoadedEnv;
	});

	function setEnv(key: string, value: string) {
		touched.add(key);
		process.env[key] = value;
	}

	test('should report every key resolved by the schema, as strings', () => {
		const output = loadEnvFiles({ loader: 'varlock', path: fixture('valid') });

		expect(output.parsed).toEqual({
			VARLOCK_TEST_HOST: 'localhost',
			VARLOCK_TEST_PORT: '6379',
			VARLOCK_TEST_ENABLED: 'true',
			VARLOCK_TEST_MODE: 'fast',
			VARLOCK_TEST_PRESET: 'from-schema'
		});
	});

	test('should leave `@internal` items and varlock bookkeeping out of `parsed`', () => {
		const output = loadEnvFiles({ loader: 'varlock', path: fixture('valid') });

		expect(output.parsed).not.toHaveProperty('VARLOCK_TEST_INTERNAL');
		expect(Object.keys(output.parsed!).filter((key) => /^_{1,2}VARLOCK_/i.test(key))).toEqual([]);
	});

	test('should inject the resolved values into `process.env`', () => {
		loadEnvFiles({ loader: 'varlock', path: fixture('valid') });

		expect(process.env.VARLOCK_TEST_PORT).toBe('6379');
		expect(process.env.VARLOCK_TEST_ENABLED).toBe('true');
	});

	test('should still report a key that resolves to the value `process.env` already holds', () => {
		setEnv('VARLOCK_TEST_PRESET', 'from-schema');

		const output = loadEnvFiles({ loader: 'varlock', path: fixture('valid') });

		expect(output.parsed).toHaveProperty('VARLOCK_TEST_PRESET', 'from-schema');
	});

	test('should let `process.env` override the schema, as varlock does', () => {
		setEnv('VARLOCK_TEST_PORT', '8080');

		const output = loadEnvFiles({ loader: 'varlock', path: fixture('valid') });

		expect(output.parsed).toHaveProperty('VARLOCK_TEST_PORT', '8080');
	});

	test('should map `env` to `--env`', () => {
		const output = loadEnvFiles({ loader: 'varlock', path: fixture('valid'), env: 'production' });

		expect(output.parsed).toHaveProperty('VARLOCK_TEST_HOST', 'production.example.com');
	});

	test('should filter resolved keys by `prefix`', () => {
		const output = loadEnvFiles({ loader: 'varlock', path: fixture('valid'), prefix: 'VARLOCK_TEST_P' });

		expect(output.parsed).toEqual({ VARLOCK_TEST_PORT: '6379', VARLOCK_TEST_PRESET: 'from-schema' });
	});

	test('should accept a `path` containing spaces', () => {
		const output = loadEnvFiles({ loader: 'varlock', path: fixture('with space') });

		expect(output.parsed).toHaveProperty('VARLOCK_TEST_PORT', '6379');
	});

	test('should accept a `URL` as `path`', () => {
		const output = loadEnvFiles({ loader: 'varlock', path: new URL('./varlock-fixtures/valid', import.meta.url) });

		expect(output.parsed).toHaveProperty('VARLOCK_TEST_PORT', '6379');
	});

	test('should reject an `env` containing whitespace', () => {
		expect(() => loadEnvFiles({ loader: 'varlock', path: fixture('valid'), env: 'my env' })).toThrow(/'env' option cannot contain whitespace/);
	});

	test('should not put ANSI colour codes in the message of an invalid schema', () => {
		setEnv('FORCE_COLOR', '1');

		let message = '';
		try {
			loadEnvFiles({ loader: 'varlock', path: fixture('invalid') });
		} catch (error) {
			message = (error as Error).message;
		}

		expect(message).toContain('VARLOCK_TEST_MISSING');
		expect(message).not.toContain('\u001B');
	});

	test('should throw an `Error` carrying the summary of an invalid schema instead of exiting', () => {
		const exit = vi.spyOn(process, 'exit');

		expect(() => loadEnvFiles({ loader: 'varlock', path: fixture('invalid') })).toThrow(/VARLOCK_TEST_MISSING/);
		expect(exit).not.toHaveBeenCalled();
	});
});
