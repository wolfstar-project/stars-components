import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

class ProcessExit extends Error {
	constructor(public readonly code: number) {
		super(`process.exit(${code})`);
	}
}

async function createFixtureDirectory() {
	const tempDirectory = await mkdtemp(join(tmpdir(), 'i18next-type-generator-cli-'));
	const sourceDirectory = join(tempDirectory, 'locales', 'en-US');
	const destinationFile = join(tempDirectory, 'output', 'i18next.d.ts');

	await mkdir(join(sourceDirectory, 'commands'), { recursive: true });
	await writeFile(join(sourceDirectory, 'commands', 'shared.json'), JSON.stringify({ hello: 'world' }));

	return { tempDirectory, sourceDirectory, destinationFile };
}

async function runCli(argv: string[]) {
	vi.resetModules();

	const originalArgv = process.argv;
	process.argv = ['node', 'cli.js', ...argv];

	const logs: string[] = [];
	const errors: string[] = [];
	const logSpy = vi.spyOn(console, 'log').mockImplementation((...args) => {
		logs.push(args.map(String).join(' '));
	});
	const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
		errors.push(args.map(String).join(' '));
	});
	const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
		throw new ProcessExit(code ?? 0);
	});

	try {
		await import('../src/cli.ts');
		return { code: 0, stdout: logs.join('\n'), stderr: errors.join('\n') };
	} catch (error) {
		if (error instanceof ProcessExit) {
			return { code: error.code, stdout: logs.join('\n'), stderr: errors.join('\n') };
		}

		throw error;
	} finally {
		process.argv = originalArgv;
		logSpy.mockRestore();
		errorSpy.mockRestore();
		exitSpy.mockRestore();
	}
}

describe('cli', () => {
	let fixtureDirectory: string;
	let sourceDirectory: string;
	let destinationFile: string;

	beforeEach(async () => {
		({ tempDirectory: fixtureDirectory, sourceDirectory, destinationFile } = await createFixtureDirectory());
	});

	afterEach(async () => {
		await rm(fixtureDirectory, { recursive: true, force: true });
	});

	test('GIVEN --version THEN prints the package version', async () => {
		const packageJson = JSON.parse(await readFile(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));
		const { code, stdout } = await runCli(['--version']);

		expect(code).toBe(0);
		expect(stdout.trim()).toBe(packageJson.version);
	});

	test('GIVEN --help THEN exits successfully', async () => {
		const { code } = await runCli(['--help']);

		expect(code).toBe(0);
	});

	test('GIVEN source and destination THEN generates types', async () => {
		const { code, stderr } = await runCli([sourceDirectory, destinationFile, '--no-oxfmt', '--no-prettier']);

		expect(code).toBe(0);
		expect(stderr).toBe('');

		const output = await readFile(destinationFile, 'utf8');
		expect(output).toContain('commands/shared');
	});

	test('GIVEN invalid indentation THEN exits with an error', async () => {
		const { code, stderr } = await runCli([sourceDirectory, destinationFile, '--indentation', 'invalid', '--no-oxfmt', '--no-prettier']);

		expect(code).toBe(1);
		expect(stderr).toContain('indentation');
	});

	test('GIVEN tabs indentation THEN generates types', async () => {
		const { code } = await runCli([sourceDirectory, destinationFile, '--indentation', 'tabs', '--no-oxfmt', '--no-prettier']);

		expect(code).toBe(0);

		const output = await readFile(destinationFile, 'utf8');
		expect(output).toContain('\tinterface CustomTypeOptions');
	});

	test('GIVEN numeric indentation THEN generates types', async () => {
		const { code } = await runCli([sourceDirectory, destinationFile, '--indentation', '2', '--no-oxfmt', '--no-prettier']);

		expect(code).toBe(0);

		const output = await readFile(destinationFile, 'utf8');
		expect(output).toContain('  interface CustomTypeOptions');
	});
});
