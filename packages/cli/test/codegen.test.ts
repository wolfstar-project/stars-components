import { PassThrough } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Diagnostic } from 'nostics';
import { runCodegen } from '../src/commands/codegen.js';
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
});
