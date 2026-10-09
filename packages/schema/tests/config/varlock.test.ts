import { Module } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectVarlock, loadStarsConfig } from '../../src/index.js';
import { createFixture, type Fixture } from './helpers.js';

const WITH_ENV_UTILITIES = JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } });
const SCHEMA = '# @defaultRequired=false\nHTTP_PORT=4800\n';
/** Enough of the package for `require.resolve('varlock/exec-sync-varlock')`. */
const FAKE_VARLOCK = {
	'node_modules/varlock/package.json': JSON.stringify({
		name: 'varlock',
		version: '0.0.0',
		exports: { './exec-sync-varlock': './exec-sync-varlock.cjs' }
	}),
	'node_modules/varlock/exec-sync-varlock.cjs': 'module.exports = {};'
};

/**
 * `pnpm` points `NODE_PATH` at its hoisted store, where `varlock` is: a fixture would find it wherever it lives. Dropping
 * it (and Node's cached copy of it) makes "not installed" mean the fixture's own `node_modules`.
 */
function ignoreNodePath(): void {
	const nodePath = process.env.NODE_PATH;
	beforeEach(() => {
		delete process.env.NODE_PATH;
		(Module as unknown as { _initPaths(): void })._initPaths();
	});
	afterEach(() => {
		if (nodePath !== undefined) process.env.NODE_PATH = nodePath;
		(Module as unknown as { _initPaths(): void })._initPaths();
	});
}

/** The layouts `@wolfstar/env-utilities` is tested against: both lookups have to agree on them. */
const runtimeFixture = (name: string) => fileURLToPath(new URL(`../../../env-utilities/tests/varlock-fixtures/detect/${name}`, import.meta.url));

describe('detectVarlock', () => {
	ignoreNodePath();
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test.each([
		['src-schema', { source: 'src', path: true }],
		['root-schema', { source: 'root' }],
		['load-path', { source: 'loadPath' }],
		['none', null]
	] as const)('finds the schema of the env-utilities fixture %s', (name, expected) => {
		const { schema } = detectVarlock(runtimeFixture(name));
		if (expected === null) return expect(schema).toBeNull();

		expect(schema?.source).toBe(expected.source);
		expect(schema?.path !== undefined).toBe('path' in expected);
	});

	test('looks in src before the project root, like the env files', async () => {
		fixture = await createFixture({ '.env.schema': SCHEMA, 'src/.env.schema': SCHEMA });
		expect(detectVarlock(fixture.root).schema).toEqual({ source: 'src', path: join(fixture.root, 'src') });
	});

	test('honours varlock.loadPath of package.json', async () => {
		fixture = await createFixture({ 'package.json': JSON.stringify({ varlock: { loadPath: 'config' } }) });
		expect(detectVarlock(fixture.root).schema).toEqual({ source: 'loadPath' });
	});

	test('reports whether varlock is a dependency and whether it can be resolved', async () => {
		fixture = await createFixture({ 'package.json': JSON.stringify({ devDependencies: { varlock: '^1.0.0' } }) });
		expect(detectVarlock(fixture.root)).toMatchObject({ dependency: true, installed: false });

		await fixture.write('node_modules/varlock/package.json', FAKE_VARLOCK['node_modules/varlock/package.json']);
		await fixture.write('node_modules/varlock/exec-sync-varlock.cjs', FAKE_VARLOCK['node_modules/varlock/exec-sync-varlock.cjs']);
		expect(detectVarlock(fixture.root)).toMatchObject({ dependency: true, installed: true });
	});

	test('copes with a project without package.json', async () => {
		fixture = await createFixture({});
		expect(detectVarlock(fixture.root)).toEqual({ schema: null, installed: false, dependency: false });
	});
});

describe('stars.config env.loader detection', () => {
	ignoreNodePath();
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	async function load(files: Record<string, string>) {
		fixture = await createFixture({ 'src/main.ts': '', 'package.json': WITH_ENV_UTILITIES, ...files });
		return loadStarsConfig({ cwd: fixture.root, env: {} });
	}

	test('follows the runtime: a schema and an installed varlock select the varlock loader', async () => {
		const { env, dev } = await load({ '.env.schema': SCHEMA, '.env': 'HTTP_PORT=4000', ...FAKE_VARLOCK });
		expect(env.loader).toBe('varlock');
		// `options` stays what the user wrote, since it is what the bot receives.
		expect(env.options).toEqual({});
		// A dotenv file is not what the bot loads then.
		expect(dev.url).toBe('http://localhost:3000');
	});

	test('keeps the detection off without an installed varlock', async () => {
		const { env, dev } = await load({ '.env.schema': SCHEMA, '.env': 'HTTP_PORT=4000' });
		expect(env.loader).toBeUndefined();
		expect(dev.url).toBe('http://localhost:4000');
	});

	test('keeps the detection off without a schema', async () => {
		expect((await load({ ...FAKE_VARLOCK })).env.loader).toBeUndefined();
	});

	test('keeps the detection off when env.path is set, like the runtime', async () => {
		const { env } = await load({
			'.env.schema': SCHEMA,
			...FAKE_VARLOCK,
			'stars.config.mjs': "export default { env: { path: 'config/.env' } };"
		});
		expect(env.loader).toBeUndefined();
	});

	test('lets an explicit loader win', async () => {
		const { env } = await load({ '.env.schema': SCHEMA, ...FAKE_VARLOCK, 'stars.config.mjs': "export default { env: { loader: 'dotenv' } };" });
		expect(env.loader).toBe('dotenv');
	});

	test('reports an explicit varlock loader as it is', async () => {
		const { env } = await load({ 'stars.config.mjs': "export default { env: { loader: 'varlock' } };" });
		expect(env.loader).toBe('varlock');
	});

	test('keeps the detection off before compatibility version 6', async () => {
		const { env } = await load({
			'.env.schema': SCHEMA,
			...FAKE_VARLOCK,
			'stars.config.mjs': 'export default { future: { compatibilityVersion: 5 } };'
		});
		expect(env.loader).toBeUndefined();
	});

	test('keeps the detection off when env is disabled', async () => {
		const { env } = await load({ '.env.schema': SCHEMA, ...FAKE_VARLOCK, 'stars.config.mjs': 'export default { env: false };' });
		expect(env.loader).toBeUndefined();
	});
});
