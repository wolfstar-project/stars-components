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
	'LATER'
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

		const output = loadEnvFiles({ path: join(directory, '.env') });

		expect(output.error).toBeUndefined();
		expect(output.parsed).toEqual({ BASE: 'base' });
	});

	test('returns no variables and no error when no file exists', () => {
		const output = loadEnvFiles({ path: join(directory, '.env') });

		expect(output.error).toBeUndefined();
		expect(output.parsed).toEqual({});
	});
});
