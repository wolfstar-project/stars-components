import { createFixture, type Fixture } from './helpers.js';

// Nothing on the `--help`/`--version` path may load the configuration loader or the file watcher.
vi.mock('c12', () => {
	throw new Error('c12 must not be loaded on the cold path');
});
vi.mock('chokidar', () => {
	throw new Error('chokidar must not be loaded on the cold path');
});

class ProcessExit extends Error {
	public constructor(public readonly code: number) {
		super(`process.exit(${code})`);
	}
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
	const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
		logs.push(String(chunk));
		return true;
	});
	const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
		throw new ProcessExit(Number(code ?? 0));
	});

	try {
		await import('../src/cli.ts');
		return { code: 0, stdout: logs.join('\n'), stderr: errors.join('\n') };
	} catch (error) {
		if (error instanceof ProcessExit) return { code: error.code, stdout: logs.join('\n'), stderr: errors.join('\n') };
		throw error;
	} finally {
		process.argv = originalArgv;
		logSpy.mockRestore();
		errorSpy.mockRestore();
		writeSpy.mockRestore();
		exitSpy.mockRestore();
	}
}

describe('stars', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('--version prints the version without loading anything else', async () => {
		const result = await runCli(['--version']);
		expect(result.code).toBe(0);
		expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
	});

	test('--help lists the commands', async () => {
		const result = await runCli(['--help']);
		expect(result.code).toBe(0);
		for (const command of ['dev', 'build', 'info', 'codegen']) expect(result.stdout).toContain(command);
		expect(await runCli([])).toMatchObject({ code: 0 });
	});

	test('<command> --help shows the command usage', async () => {
		const result = await runCli(['dev', '-h']);
		expect(result.code).toBe(0);
		expect(result.stdout).toContain('--no-tui');
		expect(result.stdout).toContain('--config');
	});

	test('unknown commands fail with exit code 1 and no stack trace', async () => {
		const result = await runCli(['nope']);
		expect(result.code).toBe(1);
		expect(result.stderr).toContain('Unknown command');
		expect(result.stderr).not.toContain('    at ');
	});

	test('info reports invalid configuration with exit code 2', async () => {
		fixture = await createFixture({ 'src/main.js': '' });
		const result = await runCli(['info', '--cwd', fixture.root, '--config', 'missing.ts']);
		expect(result.code).toBe(2);
		expect(result.stderr).toContain('Configuration file not found');
		expect(result.stderr).toContain('hint:');
	});
});
