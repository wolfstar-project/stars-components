import { PassThrough } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Diagnostic } from 'nostics';
import { runCommand } from 'citty';
import codegenCommand, { runCodegen } from '../src/commands/codegen.js';
import { createFixture, type Fixture } from './helpers.js';

function capture(): { stream: PassThrough; text(): string } {
	const stream = new PassThrough();
	let output = '';
	stream.on('data', (chunk: Buffer) => (output += chunk.toString()));
	return { stream, text: () => output };
}

const FAKE_GENERATOR = "import { writeFileSync } from 'node:fs';\nwriteFileSync(process.argv[3], '// generated\\n');\n";
const FAILING_GENERATOR = "process.stderr.write('boom');\nprocess.exit(1);\n";

async function createProject(): Promise<Fixture> {
	return createFixture({
		'package.json': '{"name":"bot","type":"module"}',
		'src/main.ts': '',
		'src/locales/en-US/common.json': '{}',
		'stars.config.mjs': "export default { imports: false, codegen: { i18n: { locales: 'src/locales', output: 'src/i18next.d.ts' } } };",
		'node_modules/@wolfstar/i18next-type-generator/package.json': '{"name":"@wolfstar/i18next-type-generator","main":"cli.mjs","type":"module"}',
		'node_modules/@wolfstar/i18next-type-generator/cli.mjs': FAKE_GENERATOR
	});
}

describe('runCodegen', () => {
	let fixture: Fixture;

	afterEach(async () => fixture.cleanup());

	test('says so when no generator is configured', async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.ts': '',
			'stars.config.mjs': 'export default { imports: false, codegen: { i18n: false } };'
		});
		const out = capture();

		await runCodegen({ cwd: fixture.root, stdout: out.stream });

		expect(out.text()).toContain('nothing to generate');
	});

	test('prints machine-readable output with --json', async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.ts': '',
			'stars.config.mjs': 'export default { imports: false, codegen: { i18n: false } };'
		});
		const out = capture();

		await runCodegen({ cwd: fixture.root, stdout: out.stream, json: true });

		expect(JSON.parse(out.text())).toEqual({ check: false, results: [] });
	});

	test('writes the generated file, then reports it as up to date', async () => {
		fixture = await createProject();
		const out = capture();

		await runCodegen({ cwd: fixture.root, stdout: out.stream });
		expect(out.text()).toContain('written');
		await expect(readFile(join(fixture.root, 'src/i18next.d.ts'), 'utf-8')).resolves.toBe('// generated\n');

		const check = capture();
		await runCodegen({ cwd: fixture.root, stdout: check.stream, check: true });
		expect(check.text()).toContain('up-to-date');
	});

	test('--check fails when the generated file is stale or missing', async () => {
		fixture = await createProject();

		const error = await runCodegen({ cwd: fixture.root, stdout: capture().stream, check: true }).catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(Diagnostic);
		expect(error).toMatchObject({ code: 'CODEGEN_OUTDATED' });
	});

	test('fails with an actionable error when the generator exits non-zero', async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.ts': '',
			'src/locales/en-US/common.json': '{}',
			'stars.config.mjs': "export default { imports: false, codegen: { i18n: { locales: 'src/locales', output: 'src/i18next.d.ts' } } };",
			'node_modules/@wolfstar/i18next-type-generator/package.json':
				'{"name":"@wolfstar/i18next-type-generator","main":"cli.mjs","type":"module"}',
			'node_modules/@wolfstar/i18next-type-generator/cli.mjs': FAILING_GENERATOR
		});

		await expect(runCodegen({ cwd: fixture.root, stdout: capture().stream })).rejects.toMatchObject({ code: 'CODEGEN_FAILED' });
	});

	describe('commands', () => {
		const commands = { global: [{ name: 'ping', options: [{ type: 3, name: 'text', required: true }] }], guilds: {} };

		async function createCommandsProject(config = 'commands: true'): Promise<Fixture> {
			return createFixture({
				'package.json': '{"name":"bot","type":"module"}',
				'src/main.ts': '',
				'stars.config.mjs': `export default { imports: false, codegen: { i18n: false, ${config} } };`
			});
		}

		test('writes the declaration file, creating its directory, then reports it as up to date', async () => {
			fixture = await createCommandsProject();
			const out = capture();

			await runCodegen({ cwd: fixture.root, stdout: out.stream, commands });
			expect(out.text()).toContain('commands: written');
			const written = await readFile(join(fixture.root, 'src/@types/commands.d.ts'), 'utf-8');
			expect(written).toContain("'ping': {\n      text: string;\n    };");

			const check = capture();
			await runCodegen({ cwd: fixture.root, stdout: check.stream, check: true, commands });
			expect(check.text()).toContain('commands: up-to-date');
		});

		test('--check fails when a builder changed since the file was written, and leaves the file alone', async () => {
			fixture = await createCommandsProject("commands: { output: 'types/commands.d.ts' }");
			await runCodegen({ cwd: fixture.root, stdout: capture().stream, commands });
			const before = await readFile(join(fixture.root, 'types/commands.d.ts'), 'utf-8');

			const changed = { global: [{ name: 'ping', options: [{ type: 3, name: 'text' }] }], guilds: {} };
			const error = await runCodegen({ cwd: fixture.root, stdout: capture().stream, check: true, commands: changed }).catch(
				(caught: unknown) => caught
			);

			expect(error).toMatchObject({ code: 'CODEGEN_OUTDATED' });
			await expect(readFile(join(fixture.root, 'types/commands.d.ts'), 'utf-8')).resolves.toBe(before);
		});

		test('--check fails when the file does not exist yet', async () => {
			fixture = await createCommandsProject();

			await expect(runCodegen({ cwd: fixture.root, stdout: capture().stream, check: true, commands })).rejects.toMatchObject({
				code: 'CODEGEN_OUTDATED'
			});
		});

		test('reports it with --json like the i18n generator', async () => {
			fixture = await createCommandsProject();
			const out = capture();

			await runCodegen({ cwd: fixture.root, stdout: out.stream, json: true, commands });

			expect(JSON.parse(out.text())).toEqual({
				check: false,
				results: [{ generator: 'commands', output: join(fixture.root, 'src/@types/commands.d.ts'), status: 'written' }]
			});
		});

		test('asks for a build when the bot has not been built', async () => {
			fixture = await createCommandsProject();

			await expect(runCodegen({ cwd: fixture.root, stdout: capture().stream })).rejects.toMatchObject({ code: 'LOCAL_COMMANDS_UNAVAILABLE' });
		});
	});

	describe('--only', () => {
		const commands = { global: [{ name: 'ping', options: [{ type: 3, name: 'text', required: true }] }], guilds: {} };

		async function createBothProject(config = 'commands: true'): Promise<Fixture> {
			return createFixture({
				'package.json': '{"name":"bot","type":"module"}',
				'src/main.ts': '',
				'src/locales/en-US/common.json': '{}',
				'stars.config.mjs': `export default { imports: false, codegen: { i18n: { locales: 'src/locales', output: 'src/i18next.d.ts' }, ${config} } };`,
				'node_modules/@wolfstar/i18next-type-generator/package.json':
					'{"name":"@wolfstar/i18next-type-generator","main":"cli.mjs","type":"module"}',
				'node_modules/@wolfstar/i18next-type-generator/cli.mjs': FAKE_GENERATOR
			});
		}

		test('--only i18n skips the commands, so it passes where the bot is not built', async () => {
			fixture = await createBothProject();
			const out = capture();

			await runCodegen({ cwd: fixture.root, stdout: out.stream, only: ['i18n'] });

			expect(out.text()).toContain('i18n: written');
			expect(out.text()).not.toContain('commands');
		});

		test('--check with --only i18n still fails when the i18n file is stale', async () => {
			fixture = await createBothProject();

			await expect(runCodegen({ cwd: fixture.root, stdout: capture().stream, only: ['i18n'], check: true })).rejects.toMatchObject({
				code: 'CODEGEN_OUTDATED'
			});
		});

		test('--only commands skips the i18n generator', async () => {
			fixture = await createBothProject();
			const out = capture();

			await runCodegen({ cwd: fixture.root, stdout: out.stream, only: ['commands'], commands });

			expect(out.text()).toContain('commands: written');
			expect(out.text()).not.toContain('i18n');
			await expect(readFile(join(fixture.root, 'src/i18next.d.ts'), 'utf-8')).rejects.toMatchObject({ code: 'ENOENT' });
		});

		test('takes a comma-separated list, and lists in --json only the selected generators', async () => {
			fixture = await createBothProject();
			const out = capture();

			await runCodegen({ cwd: fixture.root, stdout: out.stream, only: ['commands, i18n'], json: true, commands });

			expect(JSON.parse(out.text()).results.map((result: { generator: string }) => result.generator)).toEqual(['i18n', 'commands']);

			const one = capture();
			await runCodegen({ cwd: fixture.root, stdout: one.stream, only: ['i18n'], json: true });
			expect(JSON.parse(one.text()).results.map((result: { generator: string }) => result.generator)).toEqual(['i18n']);
		});

		test('is read from the command line, repeated or comma-separated', async () => {
			fixture = await createBothProject();
			const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
			try {
				// `commands` needs the built bot, which this fixture does not have: the run reaches it only when the
				// second occurrence of the flag is read as well.
				await expect(
					runCommand(codegenCommand, { rawArgs: ['--cwd', fixture.root, '--json', '--only', 'i18n', '--only=commands'] })
				).rejects.toMatchObject({ code: 'LOCAL_COMMANDS_UNAVAILABLE' });
				const generators = (call: unknown[]) => JSON.parse(String(call[0])).results.map((result: { generator: string }) => result.generator);

				write.mockClear();
				await runCommand(codegenCommand, { rawArgs: ['--cwd', fixture.root, '--json', '--only', 'i18n'] });
				expect(generators(write.mock.calls[0]!)).toEqual(['i18n']);
			} finally {
				write.mockRestore();
			}
		});

		test('ignores an empty list, which runs every enabled generator', async () => {
			fixture = await createBothProject('commands: false');
			const out = capture();

			await runCodegen({ cwd: fixture.root, stdout: out.stream, only: [] });

			expect(out.text()).toContain('i18n: written');
		});

		test('rejects an unknown generator, before loading the project', async () => {
			const error = await runCodegen({ cwd: '/nowhere', stdout: capture().stream, only: ['i18n', 'locales'] }).catch(
				(caught: unknown) => caught
			);

			expect(error).toMatchObject({ code: 'INVALID_OPTION' });
			expect(error).toBeInstanceOf(Diagnostic);
			expect((error as Diagnostic).message).toContain('locales');
		});

		test('rejects a generator that is off, so a job cannot pass while checking nothing', async () => {
			fixture = await createBothProject('commands: false');

			await expect(
				runCodegen({ cwd: fixture.root, stdout: capture().stream, only: ['commands'], check: true, commands })
			).rejects.toMatchObject({
				code: 'CODEGEN_GENERATOR_DISABLED'
			});
		});
	});
});
