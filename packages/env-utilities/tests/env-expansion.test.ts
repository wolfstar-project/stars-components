import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadEnvFiles } from '../src/lib/env-loader';

const originalNodeEnv = process.env.NODE_ENV;
const KEYS = [
	'BASE',
	'NEEDS_BASE',
	'LOCAL_ONLY',
	'USES_LOCAL',
	'PRIORITY',
	'FROM_SHELL',
	'MISSING_REF',
	'DEFAULTED',
	'MY_APP_URL',
	'HOST',
	'FORWARD',
	'LATER',
	'SELF',
	'CYCLE_A',
	'CYCLE_B',
	'CYCLE_C',
	'DOTENV_CONFIG_QUIET'
];

let directory: string;

function write(file: string, contents: string) {
	writeFileSync(join(directory, file), contents);
}

describe('Env file loader cross-file expansion', () => {
	beforeEach(() => {
		process.env.NODE_ENV = 'development';
		for (const key of KEYS) delete process.env[key];
		directory = mkdtempSync(join(tmpdir(), 'env-utilities-'));
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env.NODE_ENV = originalNodeEnv;
		for (const key of KEYS) delete process.env[key];
		rmSync(directory, { recursive: true, force: true });
	});

	test('resolves a reference in a specific file to a variable defined only in a more generic file', () => {
		write('.env.local', 'NEEDS_BASE=${BASE}-from-local\n');
		write('.env', 'BASE=base\n');

		const output = loadEnvFiles({ path: join(directory, '.env') });

		expect(output.parsed).toEqual({ BASE: 'base', NEEDS_BASE: 'base-from-local' });
		expect(process.env.NEEDS_BASE).toBe('base-from-local');
		expect(process.env.BASE).toBe('base');
	});

	test('resolves a reference in a generic file to a variable defined only in a more specific file', () => {
		write('.env.local', 'LOCAL_ONLY=local\n');
		write('.env', 'USES_LOCAL=${LOCAL_ONLY}-generic\n');

		const output = loadEnvFiles({ path: join(directory, '.env') });

		expect(output.parsed).toEqual({ LOCAL_ONLY: 'local', USES_LOCAL: 'local-generic' });
		expect(process.env.USES_LOCAL).toBe('local-generic');
	});

	test('resolves forward references within a single file', () => {
		write('.env', 'FORWARD=${LATER}-fwd\nLATER=later\n');

		loadEnvFiles({ path: join(directory, '.env') });

		expect(process.env.FORWARD).toBe('later-fwd');
	});

	test('lets the more specific file win over the generic one, including for references', () => {
		write('.env.development.local', 'PRIORITY=specific\n');
		write('.env', 'PRIORITY=generic\nNEEDS_BASE=${PRIORITY}-ref\n');

		const output = loadEnvFiles({ path: join(directory, '.env') });

		expect(output.parsed).toEqual({ PRIORITY: 'specific', NEEDS_BASE: 'specific-ref' });
		expect(process.env.PRIORITY).toBe('specific');
	});

	test('lets src/.env win over the root .env while still merging both', () => {
		mkdirSync(join(directory, 'src'));
		write('src/.env', 'PRIORITY=source\n');
		write('.env', 'PRIORITY=root\nBASE=base\n');
		write('.env.local', 'NEEDS_BASE=${BASE}-${PRIORITY}\n');
		vi.spyOn(process, 'cwd').mockReturnValue(directory);

		const output = loadEnvFiles();

		expect(output.parsed).toEqual({ PRIORITY: 'source', BASE: 'base', NEEDS_BASE: 'base-source' });
	});

	test('does not overwrite a variable already present in process.env', () => {
		process.env.FROM_SHELL = 'from-shell';
		write('.env.local', 'FROM_SHELL=from-local\n');
		write('.env', 'FROM_SHELL=from-generic\nNEEDS_BASE=${FROM_SHELL}-ref\n');

		const output = loadEnvFiles({ path: join(directory, '.env') });

		expect(process.env.FROM_SHELL).toBe('from-shell');
		expect(process.env.NEEDS_BASE).toBe('from-shell-ref');
		expect(output.parsed).toEqual({ FROM_SHELL: 'from-shell', NEEDS_BASE: 'from-shell-ref' });
	});

	test('expands a reference to a missing variable to an empty string and honours `${X:-default}`', () => {
		write('.env', 'MISSING_REF=${DOES_NOT_EXIST}\nDEFAULTED=${DOES_NOT_EXIST:-fallback}\n');

		loadEnvFiles({ path: join(directory, '.env') });

		expect(process.env.MISSING_REF).toBe('');
		expect(process.env.DEFAULTED).toBe('fallback');
	});

	test('applies the prefix filter after expansion so a prefixed value can reference an unprefixed variable', () => {
		write('.env.local', 'MY_APP_URL=https://${HOST}/api\n');
		write('.env', 'HOST=example.com\n');

		const output = loadEnvFiles({ path: join(directory, '.env'), prefix: 'MY_APP_' });

		expect(output.parsed).toEqual({ MY_APP_URL: 'https://example.com/api' });
	});

	test('ignores missing files without an error', () => {
		write('.env', 'BASE=base\n');
		const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

		let output: ReturnType<typeof loadEnvFiles> | undefined;
		expect(() => (output = loadEnvFiles({ path: join(directory, '.env'), debug: true }))).not.toThrow();

		expect(output?.parsed).toEqual({ BASE: 'base' });
		expect(debug.mock.calls.some(([message]) => String(message).includes('`.env.development.local` file not found'))).toBe(true);
	});

	test('returns no variables when no file exists', () => {
		expect(loadEnvFiles({ path: join(directory, '.env') }).parsed).toEqual({});
	});

	test('resolves a reference cycle spanning several files to empty strings instead of never terminating', () => {
		write('.env.local', 'CYCLE_A=${CYCLE_B}\nCYCLE_C=${CYCLE_B}z\n');
		write('.env', 'CYCLE_B=${CYCLE_A}\n');

		const output = loadEnvFiles({ path: join(directory, '.env') });

		expect(output.parsed).toEqual({ CYCLE_A: '', CYCLE_B: '', CYCLE_C: 'z' });
	});

	test('keeps handling a variable that references itself', () => {
		write('.env', 'SELF=${SELF}-x\n');

		expect(loadEnvFiles({ path: join(directory, '.env') }).parsed).toEqual({ SELF: '-x' });
	});

	test('does not treat a cycle through a variable already set in process.env as a cycle', () => {
		process.env.CYCLE_B = 'from-shell';
		write('.env.local', 'CYCLE_A=${CYCLE_B}-a\n');
		write('.env', 'CYCLE_B=${CYCLE_A}\n');

		const output = loadEnvFiles({ path: join(directory, '.env') });

		expect(output.parsed).toEqual({ CYCLE_A: 'from-shell-a', CYCLE_B: 'from-shell' });
	});

	describe('dotenv logging switches', () => {
		test('logs the injected variables of every file by default', () => {
			write('.env', 'BASE=base\n');
			const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

			loadEnvFiles({ path: join(directory, '.env') });

			expect(log.mock.calls.some(([message]) => String(message).includes('injected env'))).toBe(true);
		});

		test('honours DOTENV_CONFIG_QUIET from the real environment', () => {
			process.env.DOTENV_CONFIG_QUIET = 'true';
			write('.env', 'BASE=base\n');
			const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

			loadEnvFiles({ path: join(directory, '.env') });

			expect(log.mock.calls.some(([message]) => String(message).includes('injected env'))).toBe(false);
		});
	});
});
