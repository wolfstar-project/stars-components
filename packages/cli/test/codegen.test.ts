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
});
