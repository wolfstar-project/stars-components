import { join } from 'node:path';
import { Diagnostic } from 'nostics';
import { loadConfigFile, loadStarsConfig, readProjectEnvFiles, resolveStarsConfig } from '../../src/index.js';
import { createFixture, type Fixture } from './helpers.js';

const WITH_ENV_UTILITIES = JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } });
const WITHOUT_ENV_UTILITIES = JSON.stringify({ name: 'bot' });

describe('stars.config env', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	async function load(config: string, packageJson = WITH_ENV_UTILITIES) {
		fixture = await createFixture({ 'src/main.ts': '', 'package.json': packageJson, 'stars.config.mjs': `export default ${config};` });
		return loadStarsConfig({ cwd: fixture.root, env: {} });
	}

	async function loadError(config: string, packageJson = WITH_ENV_UTILITIES): Promise<Diagnostic> {
		const error = await load(config, packageJson).catch((error: unknown) => error);
		expect(error).toBeInstanceOf(Diagnostic);
		return error as Diagnostic;
	}

	test('is enabled by default at compatibility version 5 when env-utilities is installed', async () => {
		expect((await load('{}')).env).toEqual({ enabled: true, options: {} });
	});

	test('stays off by default without the env-utilities dependency', async () => {
		expect((await load('{}', WITHOUT_ENV_UTILITIES)).env.enabled).toBe(false);
	});

	test('is off by default at compatibility version 4', async () => {
		expect((await load('{ future: { compatibilityVersion: 4 } }')).env.enabled).toBe(false);
	});

	test('can be opted into at compatibility version 4', async () => {
		expect((await load("{ future: { compatibilityVersion: 4 }, env: { prefix: 'BOT_' } }")).env).toEqual({
			enabled: true,
			options: { prefix: 'BOT_' }
		});
		expect((await load('{ future: { compatibilityVersion: 4 }, env: true }')).env).toEqual({ enabled: true, options: {} });
	});

	test('false disables it', async () => {
		expect((await load('{ env: false }')).env).toEqual({ enabled: false, options: {} });
		expect((await load("{ env: { enabled: false, prefix: 'BOT_' } }")).env).toEqual({ enabled: false, options: { prefix: 'BOT_' } });
	});

	test('mirrors every serializable EnvSetupOptions key', async () => {
		const env = { path: 'config/.env', env: 'staging', prefix: 'BOT_', loader: 'varlock', debug: true, encoding: 'latin1' };
		expect((await load(`{ env: ${JSON.stringify(env)} }`)).env).toEqual({ enabled: true, options: env, loader: 'varlock' });
	});

	test('keeps env.path relative so the build output stays portable', async () => {
		expect((await load("{ env: { path: 'config/.env' } }")).env.options.path).toBe('config/.env');
	});

	test('is off by default with Nitro', async () => {
		const packageJson = JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1', vite: '^8.0.0' } });
		expect((await load('{ experimental: { enableVite: true, enableNitro: true } }', packageJson)).env.enabled).toBe(false);
		expect((await load('{ experimental: { enableVite: true, enableNitro: true }, env: true }', packageJson)).env.enabled).toBe(true);
	});

	test.each([
		["{ env: { loader: 'nope' } }", 'env.loader'],
		['{ env: { prefix: 1 } }', 'env.prefix'],
		["{ env: { debug: 'yes' } }", 'env.debug'],
		['{ env: { processEnv: {} } }', 'env.processEnv'],
		['{ env: 1 }', 'env']
	])('rejects %s', async (config, path) => {
		const error = await loadError(config);
		expect(`${error.message} ${error.fix}`).toContain(path);
	});

	test('explicitly enabling it without env-utilities is an error', async () => {
		expect((await loadError('{ env: true }', WITHOUT_ENV_UTILITIES)).code).toBe('ENV_REQUIRES_ENV_UTILITIES');
		expect((await loadError("{ env: { prefix: 'BOT_' } }", WITHOUT_ENV_UTILITIES)).code).toBe('ENV_REQUIRES_ENV_UTILITIES');
	});

	test('reads the dev port from env.path', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'package.json': WITH_ENV_UTILITIES,
			'config/.env': 'HTTP_PORT=4000',
			'.env': 'HTTP_PORT=5000',
			'stars.config.mjs': "export default { env: { path: 'config/.env' } };"
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:4000');
	});

	test('does not read the dev port from dotenv files with the varlock loader', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'package.json': WITH_ENV_UTILITIES,
			'.env': 'HTTP_PORT=4000',
			'stars.config.mjs': "export default { env: { loader: 'varlock' } };"
		});
		// Varlock resolves `.env.schema` on its own terms: a dotenv file may be stale or not what the bot loads.
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:3000');
		expect((await loadStarsConfig({ cwd: fixture.root, env: { HTTP_PORT: '4300' } })).dev.url).toBe('http://localhost:4300');
	});

	test('reads the dev port from projectEnv when the host resolved the variables itself', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'package.json': WITH_ENV_UTILITIES,
			'.env': 'HTTP_PORT=4000',
			'stars.config.mjs': "export default { env: { loader: 'varlock' } };"
		});
		const loaded = await loadConfigFile({ cwd: fixture.root });
		const config = resolveStarsConfig({ cwd: fixture.root, ...loaded, env: {}, projectEnv: { HTTP_PORT: '4500' } });
		expect(config.dev.url).toBe('http://localhost:4500');
	});

	test('readProjectEnvFiles honours a custom path', async () => {
		fixture = await createFixture({ 'config/.env': 'HTTP_PORT=4000', '.env': 'HTTP_PORT=5000' });
		expect(readProjectEnvFiles(fixture.root, 'development', { path: 'config/.env' })).toEqual({ HTTP_PORT: '4000' });
		expect(readProjectEnvFiles(fixture.root, 'development')).toEqual({ HTTP_PORT: '5000' });
	});

	test('readProjectEnvFiles reads an absolute env.path as-is, the way @wolfstar/env-utilities does', async () => {
		const secrets = await createFixture({ '.env': 'HTTP_PORT=4100' });
		try {
			fixture = await createFixture({ '.env': 'HTTP_PORT=5000' });
			expect(readProjectEnvFiles(fixture.root, 'development', { path: join(secrets.root, '.env') })).toEqual({ HTTP_PORT: '4100' });
		} finally {
			await secrets.cleanup();
		}
	});
});
