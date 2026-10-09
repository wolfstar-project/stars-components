import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { reportWarnings } from '../src/commands/_shared.js';
import { collectChecks, runDoctor, type Check } from '../src/commands/doctor.js';
import { loadProject } from '../src/utils/hooks.js';
import { readProjectEnv } from '../src/utils/project-env.js';
import { applyVarlockConfig, planVarlockConfig } from '../src/utils/varlock-config.js';
import { inspectVarlock, varlockWarning } from '../src/utils/varlock.js';
import { createFixture, ignoreNodePath, type Fixture } from './helpers.js';

const PACKAGE = JSON.stringify({ name: 'bot', type: 'module', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } });
const SCHEMA = { '.env.schema': '# @defaultRequired=false\nHTTP_PORT=4800\n' };
const VARLOCK = {
	'node_modules/varlock/package.json': JSON.stringify({
		name: 'varlock',
		version: '0.0.0',
		exports: { './exec-sync-varlock': './exec-sync-varlock.cjs' }
	}),
	'node_modules/varlock/exec-sync-varlock.cjs': 'module.exports = {};'
};
/** What `stars.config.ts` imports, so the fixtures' configuration files load. */
const FRAMEWORK = {
	'node_modules/@wolfstar/http-framework/package.json': JSON.stringify({
		name: '@wolfstar/http-framework',
		version: '6.1.0',
		type: 'module',
		exports: { './config': './config.js' }
	}),
	'node_modules/@wolfstar/http-framework/config.js': 'export const defineConfig = (config) => config;'
};
const VARLOCK_LOADER = "export default { env: { loader: 'varlock' } };";
const CONFIG = (body: string) => `import { defineConfig } from '@wolfstar/http-framework/config';\n\nexport default defineConfig(${body});\n`;

describe('varlock and stars.config', () => {
	let fixture: Fixture;
	ignoreNodePath();

	afterEach(async () => {
		await fixture?.cleanup();
	});

	async function project(files: Record<string, string>) {
		fixture = await createFixture({ 'src/main.ts': '', 'package.json': PACKAGE, ...FRAMEWORK, ...files });
		return loadProject({ cwd: fixture.root, env: {} });
	}

	describe('inspectVarlock', () => {
		test('a schema, varlock and no loader is implicit', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK });
			expect(inspectVarlock(config)).toMatchObject({ kind: 'implicit' });
			expect(varlockWarning(config)?.code).toBe('VARLOCK_LOADER_IMPLICIT');
		});

		test('a varlock dependency that is not installed does not make the schema implicit: the runtime falls back to dotenv', async () => {
			const { config } = await project({
				...SCHEMA,
				'package.json': JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1', varlock: '^1.0.0' } })
			});
			expect(inspectVarlock(config)).toMatchObject({ kind: 'not-installed' });
		});

		test('a schema without varlock means the bot falls back to dotenv', async () => {
			const { config } = await project({ ...SCHEMA });
			expect(inspectVarlock(config)).toMatchObject({ kind: 'not-installed' });
			expect(varlockWarning(config)?.code).toBe('VARLOCK_NOT_INSTALLED');
		});

		test('a schema with another explicit loader is a mismatch, and prepare stays quiet about it', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK, 'stars.config.mjs': "export default { env: { loader: 'dotenv' } };" });
			expect(inspectVarlock(config)).toMatchObject({ kind: 'mismatch', loader: 'dotenv' });
			expect(varlockWarning(config)).toBeNull();
		});

		test('an explicit varlock loader without the package is reported', async () => {
			const { config } = await project({ 'stars.config.mjs': VARLOCK_LOADER });
			expect(inspectVarlock(config)).toMatchObject({ kind: 'missing-package' });
		});

		test('an explicit varlock loader with the package is fine', async () => {
			const { config } = await project({ ...VARLOCK, 'stars.config.mjs': VARLOCK_LOADER });
			expect(inspectVarlock(config)).toBeNull();
		});

		test.each([
			[
				'an env.path, which the runtime never combines with varlock',
				{ ...SCHEMA, ...VARLOCK, 'stars.config.mjs': "export default { env: { path: 'config/.env' } };" }
			],
			['env disabled', { ...SCHEMA, ...VARLOCK, 'stars.config.mjs': 'export default { env: false };' }],
			['no schema', { ...VARLOCK }]
		])('says nothing for %s', async (_name, files) => {
			expect(inspectVarlock((await project(files)).config)).toBeNull();
		});

		test('reportWarnings prints it for prepare, build and dev', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK });
			for (const production of [undefined, true, false]) {
				const lines: string[] = [];
				await reportWarnings(config, (text) => lines.push(text), { production });
				expect(lines.join('\n')).toContain('VARLOCK_LOADER_IMPLICIT');
			}
		});
	});

	describe('planVarlockConfig', () => {
		test('creates the scaffold stars.config.ts of create-http-framework for a TypeScript bot', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK });
			const plan = await planVarlockConfig(config);

			expect(plan).toEqual({
				action: 'create',
				file: join(fixture.root, 'stars.config.ts'),
				contents: CONFIG("{ env: { loader: 'varlock' } }")
			});
			await applyVarlockConfig(plan);
			expect((await loadProject({ cwd: fixture.root, env: {} })).config.env.options).toEqual({ loader: 'varlock' });
		});

		test('creates a plain object when the framework is not installed, so the file can still be imported', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK });
			await rm(join(fixture.root, 'node_modules/@wolfstar'), { recursive: true });

			expect(await planVarlockConfig(config)).toMatchObject({
				action: 'create',
				contents: "export default { env: { loader: 'varlock' } };\n"
			});
		});

		test('creates a file a JavaScript project can load', async () => {
			const { config: esm } = await project({ 'src/main.js': '' });
			expect(await planVarlockConfig({ ...esm, entry: join(fixture.root, 'src/main.js') })).toMatchObject({
				file: join(fixture.root, 'stars.config.js')
			});
			await fixture.cleanup();

			const { config: commonjs } = await project({ 'src/main.js': '', 'package.json': JSON.stringify({ name: 'bot' }) });
			expect(await planVarlockConfig({ ...commonjs, entry: join(fixture.root, 'src/main.js') })).toMatchObject({
				file: join(fixture.root, 'stars.config.mjs')
			});
		});

		test.each([
			['an empty defineConfig', CONFIG('{}'), /defineConfig\(\{\s*env: \{\s*loader: 'varlock'\s*\}\s*\}\);/],
			[
				'defineConfig with other options',
				CONFIG('{ dev: { debounce: 10 } }'),
				/dev: \{\s*debounce: 10\s*\},\s*env: \{\s*loader: 'varlock'\s*\}/
			],
			['an env object', CONFIG('{ env: { debug: true } }'), /env: \{\s*debug: true,\s*loader: 'varlock'\s*\}/],
			['env: true', CONFIG('{ env: true }'), /defineConfig\(\{\s*env: \{\s*loader: 'varlock'\s*\}\s*\}\);/]
		])('patches %s', async (_name, source, expected) => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK, 'stars.config.ts': source });
			const plan = await planVarlockConfig(config);

			expect(plan.action).toBe('patch');
			if (plan.action !== 'patch') return;
			expect(plan.contents).toMatch(expected);
			// Every line outside the edit survives, including the import.
			expect(plan.contents).toContain("import { defineConfig } from '@wolfstar/http-framework/config';");
		});

		test('patches a plain exported object', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK, 'stars.config.mjs': 'export default { dev: { debounce: 10 } };\n' });
			const plan = await planVarlockConfig(config);
			expect(plan).toMatchObject({ action: 'patch', file: join(fixture.root, 'stars.config.mjs') });
			expect(plan.action === 'patch' && plan.contents).toMatch(/loader: 'varlock'/);
		});

		test.each([
			['a spread', CONFIG('{ ...{ build: {} }, dev: {} }')],
			['a function config', CONFIG('async () => ({})')],
			['an env that is not a literal', CONFIG('{ env }')],
			['env: false', CONFIG('{ env: false }')],
			['a re-exported identifier', 'const config = {};\nexport default config;\n'],
			['something that does not parse', 'export default {{{']
		])('leaves %s alone and says why', async (_name, source) => {
			// The file is not loaded by the project here: the plan only reads it.
			const { config } = await project({ ...SCHEMA, ...VARLOCK });
			const file = await fixture.write('stars.config.ts', source);
			expect(await planVarlockConfig({ ...config, configFile: file })).toMatchObject({ action: 'manual', file });
		});

		test('does not edit a configuration file kind it cannot parse', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK, 'stars.config.cjs': 'module.exports = {};' });
			expect(await planVarlockConfig(config)).toMatchObject({ action: 'manual' });
		});

		test('does not overwrite a configuration edited while the question was open', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK, 'stars.config.ts': CONFIG('{}') });
			const plan = await planVarlockConfig(config);

			await fixture.write('stars.config.ts', CONFIG('{ dev: { debounce: 10 } }'));

			await expect(applyVarlockConfig(plan)).rejects.toThrow('changed in the meantime');
			expect(await readFile(join(fixture.root, 'stars.config.ts'), 'utf-8')).toBe(CONFIG('{ dev: { debounce: 10 } }'));
		});

		test('does not overwrite a configuration created while the question was open', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK });
			const plan = await planVarlockConfig(config);

			await fixture.write('stars.config.ts', CONFIG('{ dev: { debounce: 10 } }'));

			await expect(applyVarlockConfig(plan)).rejects.toThrow('created in the meantime');
			expect(await readFile(join(fixture.root, 'stars.config.ts'), 'utf-8')).toBe(CONFIG('{ dev: { debounce: 10 } }'));
		});

		test('applying a manual plan writes nothing', async () => {
			const { config } = await project({ ...SCHEMA, ...VARLOCK });
			const file = await fixture.write('stars.config.ts', CONFIG('{ env }'));
			await applyVarlockConfig(await planVarlockConfig({ ...config, configFile: file }));
			expect(await readFile(file, 'utf-8')).toBe(CONFIG('{ env }'));
		});
	});

	describe('readProjectEnv', () => {
		/** A varlock whose `load` prints the arguments it got, so the test sees where the CLI pointed it. */
		const FAKE_BIN = {
			...VARLOCK,
			'node_modules/varlock/package.json': JSON.stringify({
				name: 'varlock',
				version: '0.0.0',
				bin: { varlock: 'bin.js' },
				exports: { './exec-sync-varlock': './exec-sync-varlock.cjs' }
			}),
			'node_modules/varlock/bin.js': 'console.log(JSON.stringify({ ARGS: process.argv.slice(2).join(" ") }));'
		};

		test('loads a src/.env.schema through --path, the way the bot does', async () => {
			const { config } = await project({ 'src/.env.schema': SCHEMA['.env.schema'], ...FAKE_BIN });
			expect(config.env.loader).toBe('varlock');
			expect(readProjectEnv(config)).toEqual({ ARGS: `load --format json --path ${join(fixture.root, 'src')}` });
		});

		test('loads a root schema without --path', async () => {
			const { config } = await project({ ...SCHEMA, ...FAKE_BIN });
			expect(readProjectEnv(config)).toEqual({ ARGS: 'load --format json' });
		});
	});

	describe('stars doctor', () => {
		async function varlockCheck(files: Record<string, string>): Promise<Check | undefined> {
			const { config, hooks } = await project(files);
			const all = await collectChecks(config, hooks, { env: {}, isPortFree: () => Promise.resolve(true) });
			return all.find((entry) => entry.name === 'varlock');
		}

		test('warns about a schema stars.config does not mention, and points at --fix', async () => {
			expect(await varlockCheck({ ...SCHEMA, ...VARLOCK })).toMatchObject({
				status: 'warn',
				fix: expect.stringContaining('stars doctor --fix')
			});
		});

		test('warns when the schema is not used because of another loader', async () => {
			expect(await varlockCheck({ ...SCHEMA, ...VARLOCK, 'stars.config.mjs': "export default { env: { loader: 'node' } };" })).toMatchObject({
				status: 'warn',
				message: expect.stringContaining("env.loader is 'node'")
			});
		});

		test('errors on loader varlock without the package', async () => {
			expect(await varlockCheck({ 'stars.config.mjs': VARLOCK_LOADER })).toMatchObject({ status: 'error' });
		});

		test('is ok when varlock loads the environment, and absent when nothing involves varlock', async () => {
			expect(await varlockCheck({ ...SCHEMA, ...VARLOCK, 'stars.config.mjs': VARLOCK_LOADER })).toMatchObject({ status: 'ok' });
			await fixture.cleanup();
			expect(await varlockCheck({})).toBeUndefined();
		});

		describe('--fix', () => {
			async function fix(files: Record<string, string>, options: Parameters<typeof runDoctor>[0] = {}) {
				fixture = await createFixture({ 'src/main.ts': '', 'package.json': PACKAGE, ...FRAMEWORK, ...files });
				const stdout = new PassThrough();
				let output = '';
				stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
				// Other checks fail in a bare fixture (no framework, no token): only the varlock one matters here.
				await runDoctor({
					cwd: fixture.root,
					stdout,
					env: {},
					isPortFree: () => Promise.resolve(true),
					fix: true,
					json: true,
					...options
				}).catch(() => undefined);
				return (JSON.parse(output) as { checks: Check[] }).checks.find((entry) => entry.name === 'varlock')!;
			}

			const read = (name: string) => readFile(join(fixture.root, name), 'utf-8').catch(() => null);

			test('creates stars.config.ts after a yes', async () => {
				const check = await fix({ ...SCHEMA, ...VARLOCK }, { yes: true });
				expect(check).toMatchObject({ status: 'ok', message: expect.stringContaining('Created stars.config.ts') });
				expect(await read('stars.config.ts')).toBe(CONFIG("{ env: { loader: 'varlock' } }"));
			});

			test('patches an existing stars.config.ts after a confirmation', async () => {
				const questions: string[] = [];
				const check = await fix(
					{ ...SCHEMA, ...VARLOCK, 'stars.config.ts': CONFIG('{}') },
					{ confirm: (question) => (questions.push(question), Promise.resolve(true)) }
				);
				expect(questions).toHaveLength(1);
				expect(check).toMatchObject({ status: 'ok', message: expect.stringContaining('Updated stars.config.ts') });
				expect(await read('stars.config.ts')).toContain("loader: 'varlock'");
			});

			test('writes nothing when the question is declined', async () => {
				const check = await fix({ ...SCHEMA, ...VARLOCK }, { confirm: () => Promise.resolve(false) });
				expect(check.status).toBe('warn');
				expect(await read('stars.config.ts')).toBeNull();
			});

			test('does not ask with --json, which a prompt would corrupt', async () => {
				const check = await fix({ ...SCHEMA, ...VARLOCK }, { stdin: { isTTY: true } });
				expect(check).toMatchObject({ status: 'warn', message: expect.stringContaining('--json'), fix: expect.stringContaining('--yes') });
				expect(await read('stars.config.ts')).toBeNull();
			});

			test('reports a configuration that changed while it asked, instead of failing', async () => {
				const check = await fix(
					{ ...SCHEMA, ...VARLOCK, 'stars.config.ts': CONFIG('{}') },
					{
						confirm: async () => {
							await fixture.write('stars.config.ts', CONFIG('{ dev: { debounce: 10 } }'));
							return true;
						}
					}
				);
				expect(check).toMatchObject({ status: 'warn', message: expect.stringContaining('changed in the meantime') });
				expect(await read('stars.config.ts')).toBe(CONFIG('{ dev: { debounce: 10 } }'));
			});

			test('writes nothing without a terminal to ask in', async () => {
				const check = await fix({ ...SCHEMA, ...VARLOCK }, { stdin: { isTTY: false } });
				expect(check).toMatchObject({ status: 'warn', fix: expect.stringContaining('--yes') });
				expect(await read('stars.config.ts')).toBeNull();
			});

			test('never writes in CI, not even with --yes', async () => {
				const check = await fix({ ...SCHEMA, ...VARLOCK }, { yes: true, env: { CI: 'true' } });
				expect(check).toMatchObject({ status: 'warn', message: expect.stringContaining('CI') });
				expect(await read('stars.config.ts')).toBeNull();
			});

			test('prints the line to add when the configuration is too dynamic to edit', async () => {
				const source = CONFIG('{ ...{ dev: {} } }');
				const check = await fix({ ...SCHEMA, ...VARLOCK, 'stars.config.ts': source }, { yes: true });
				expect(check).toMatchObject({ status: 'warn', fix: expect.stringContaining("env: { loader: 'varlock' }") });
				expect(await read('stars.config.ts')).toBe(source);
			});

			test('leaves a project that needs no fix alone', async () => {
				const check = await fix({ ...SCHEMA, ...VARLOCK, 'stars.config.mjs': VARLOCK_LOADER }, { yes: true });
				expect(check.status).toBe('ok');
				expect(await read('stars.config.ts')).toBeNull();
			});
		});
	});
});
