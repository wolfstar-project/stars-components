import { loadStarsConfig, readProjectEnvFiles } from '../../src/index.js';
import { createFixture, type Fixture } from './helpers.js';

describe('development endpoint and presentation configuration', () => {
	let fixture: Fixture;
	afterEach(async () => fixture?.cleanup());
	async function load(dev: Record<string, unknown>, env: NodeJS.ProcessEnv = {}, tui?: unknown) {
		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': `export default ${JSON.stringify({ dev, tui })}` });
		return loadStarsConfig({ cwd: fixture.root, env });
	}
	test.each(['nuxt-style', 'dashboard', 'none'])('accepts the %s presentation', async (style) => {
		expect((await load({}, {}, { style })).tui.style).toBe(style);
	});
	test.each(['prompt', 'next', 'error', 'continue'])('accepts the %s conflict policy', async (portConflict) => {
		expect((await load({ portConflict })).dev.portConflict).toBe(portConflict);
	});
	test.each([{ style: 'panel' }, { style: false }, { unknown: 'dashboard' }, false, null, []])(
		'rejects invalid top-level tui config %j',
		async (tui) => {
			await expect(load({}, {}, tui)).rejects.toMatchObject({
				code:
					tui && typeof tui === 'object' && !Array.isArray(tui)
						? 'unknown' in tui
							? 'UNKNOWN_OPTION'
							: typeof tui.style === 'boolean'
								? 'INVALID_TYPE'
								: 'INVALID_CHOICE'
						: 'INVALID_TYPE'
			});
		}
	);
	test('rejects the unreleased dev.style spelling and keeps tui separate from module options', async () => {
		await expect(load({ style: 'dashboard' })).rejects.toMatchObject({ code: 'UNKNOWN_OPTION' });
		await fixture.cleanup();
		const config = await load({}, {}, { style: 'none' });
		expect(config.moduleOptions).toEqual({});
		expect(config.tui.style).toBe('none');
	});
	test('reports tui.style when its value is invalid', async () => {
		await expect(load({}, {}, { style: 'panel' })).rejects.toMatchObject({
			code: 'INVALID_CHOICE',
			message: expect.stringContaining('tui.style')
		});
	});
	test('rejects an unknown occupied-port policy', async () => {
		await expect(load({ portConflict: 'silent' })).rejects.toMatchObject({ code: 'INVALID_CHOICE' });
	});
	test.each(['file:///tmp/bot', 'ftp://localhost:3000', 'http://localhost:0', 'http://localhost:65536', 'not a URL'])(
		'rejects an unusable endpoint %s',
		async (url) => {
			await expect(load({ url })).rejects.toMatchObject({ code: 'INVALID_URL' });
		}
	);
	test.each(['http://localhost:1', 'https://[::1]:65535/path', 'https://example.com/bot'])('accepts an HTTP endpoint %s', async (url) => {
		expect((await load({ url })).dev.url).toBe(url);
	});
	test.each(['0', '-1', '65536', '1.5', 'invalid', ''])(
		'retains an invalid configured port for startup validation without blocking other commands: %s',
		async (HTTP_PORT) => {
			const config = await load({ env: { HTTP_PORT } });
			expect(config.dev.url).toBe('http://localhost:3000');
			expect(config.dev.listener.port).toBe(HTTP_PORT);
		}
	);
	test('uses explicit dev.env.PORT before process HTTP_PORT and ignores ambient generic PORT', async () => {
		const configured = await load({ env: { PORT: '4200' } }, { HTTP_PORT: '4300' });
		expect(configured.dev.url).toBe('http://localhost:4200');
		await fixture.cleanup();
		const processPort = await load({}, { PORT: '4400' });
		expect(processPort.dev.url).toBe('http://localhost:3000');
	});
	test.each([
		['BASE_PORT=4100\nHTTP_PORT=${BASE_PORT}\n', 4100],
		['BASE_PORT=4100\nHTTP_PORT=$BASE_PORT\n', 4100],
		['HTTP_PORT=${BASE_PORT:-4100}\n', 4100],
		['HTTP_PORT=${BASE_PORT:-${DEFAULT_PORT:-4100}}\n', 4100],
		['BASE_PORT=present\nHTTP_PORT=${BASE_PORT:+4100}\n', 4100],
		['HTTP_PORT=4100 # dev port\n', 4100],
		['export HTTP_PORT="4100" # quoted\n', 4100]
	])('resolves dotenv syntax before validating an inferred port: %s', async (contents, expected) => {
		fixture = await createFixture({ 'src/main.js': '', '.env': contents });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe(`http://localhost:${expected}`);
	});

	test('an empty file HTTP_PORT falls through to the configured file PORT', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'HTTP_PORT=\nPORT=4200\n' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:4200');
	});

	test.each(['abc', '0', ''])('ignores ambient PORT=%s in favor of file HTTP_PORT', async (PORT) => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'HTTP_PORT=4000\n' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: { PORT } })).dev.url).toBe('http://localhost:4000');
	});

	test.each([undefined, 'https://localhost/proxy'])('honors an explicit HTTP_PORT reference to ambient PORT with display URL %s', async (url) => {
		fixture = await createFixture({
			'src/main.js': '',
			'.env': 'HTTP_PORT=${PORT}\n',
			'stars.config.mjs': `export default ${JSON.stringify({ dev: { url } })};`
		});
		const config = await loadStarsConfig({ cwd: fixture.root, env: { PORT: '4500' } });
		expect(config.dev.listener.port).toBe('4500');
		expect(config.dev.url).toBe(url ?? 'http://localhost:4500');
	});

	test('generic file PORT uses the file value while primary HTTP_PORT expansion can reference the shell', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'PORT=4000\n' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: { PORT: '4500' } })).dev.listener.port).toBe('4000');
	});

	test('Nitro runtime ports use NITRO_PORT before process and file PORT', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'.env': 'NITRO_PORT=4100\nPORT=4200\n',
			'stars.config.mjs': 'export default { experimental: { enableVite: true, enableNitro: true } };'
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: { NITRO_PORT: '4300', PORT: '4400' } })).dev.url).toBe('http://localhost:4300');
		expect((await loadStarsConfig({ cwd: fixture.root, env: { PORT: '4400' } })).dev.url).toBe('http://localhost:4100');
	});

	test('resolves cross-layer references using process and dev overrides without mutating the environment', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'.env.development.local': 'HTTP_PORT=${BASE_PORT}\n',
			'.env': 'BASE_PORT=4100\n',
			'stars.config.mjs': "export default { dev: { env: { BASE_PORT: '4200' } } };"
		});
		const env = { BASE_PORT: '4300' };
		expect((await loadStarsConfig({ cwd: fixture.root, env })).dev.url).toBe('http://localhost:4200');
		expect(readProjectEnvFiles(fixture.root, 'development', { env }).HTTP_PORT).toBe('4300');
		expect(env).toEqual({ BASE_PORT: '4300' });
	});

	test('resolves expanded ports from a custom env path', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'package.json': JSON.stringify({ dependencies: { '@wolfstar/env-utilities': '*' } }),
			'config/.env': 'BASE_PORT=4100\nHTTP_PORT=${BASE_PORT}\n',
			'stars.config.mjs': "export default { env: { path: 'config/.env' } };"
		});
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:4100');
	});

	test('bounds unusually deep environment expansion before it can exhaust the call stack', async () => {
		const chain = Array.from({ length: 101 }, (_, i) => `PORT_${i}=\${PORT_${i + 1}}`).join('\n');
		fixture = await createFixture({ 'src/main.js': '', '.env': `HTTP_PORT=\${PORT_0}\n${chain}\nPORT_101=4100\n` });
		await expect(loadStarsConfig({ cwd: fixture.root, env: {} })).rejects.toMatchObject({ code: 'ENV_EXPANSION_FAILED' });
	});

	test('stops cyclic env references and uses the safe display default', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'HTTP_PORT=${BASE_PORT}\nBASE_PORT=${HTTP_PORT}\n' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:3000');
	});

	test('does not expose undefined references as variables read from the env file', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'HTTP_PORT=${MISSING:-3000}\n' });
		expect(readProjectEnvFiles(fixture.root, 'development', { env: {} })).toEqual({ HTTP_PORT: '3000' });
	});

	test('preserves escaped dollars when another variable aliases the escaped value', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'REVIEW_A=\\$REVIEW_B\nREVIEW_B=present\nREVIEW_C=$REVIEW_A\n' });
		expect(readProjectEnvFiles(fixture.root, 'development', { env: {} })).toEqual({
			REVIEW_A: '$REVIEW_B',
			REVIEW_B: 'present',
			REVIEW_C: '$REVIEW_B'
		});
	});

	test('clears prefixes from every variable in a cycle instead of fabricating a usable port', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'REVIEW_A=4${REVIEW_B}\nREVIEW_B=1${REVIEW_A}\nHTTP_PORT=${REVIEW_A}\n' });
		expect(readProjectEnvFiles(fixture.root, 'development', { env: {} })).toEqual({ REVIEW_A: '', REVIEW_B: '', HTTP_PORT: '' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:3000');
	});

	test('retains an invalid project port for startup without failing config resolution', async () => {
		fixture = await createFixture({ 'src/main.js': '', '.env': 'PORT=0\n' });
		expect((await loadStarsConfig({ cwd: fixture.root, env: {} })).dev.url).toBe('http://localhost:3000');
	});
});
