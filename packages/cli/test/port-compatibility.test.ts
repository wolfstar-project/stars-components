import { PassThrough } from 'node:stream';
import { loadStarsConfig, type ResolvedStarsConfig } from '@wolfstar/schema';
import { createBuilder } from '../src/builders/index.js';
import { runBuild } from '../src/commands/build.js';
import { runInfo, type ProjectInfo } from '../src/commands/info.js';
import { runDoctor } from '../src/commands/doctor.js';
import { DevService } from '../src/dev/dev-service.js';
import { prepareDevEndpoint } from '../src/dev/preflight.js';
import { createFixture, waitFor, type Fixture } from './helpers.js';

async function capture(run: (stdout: PassThrough) => Promise<void>): Promise<string> {
	const stdout = new PassThrough();
	let output = '';
	stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
	await run(stdout);
	return output;
}

describe('listener and display URL compatibility', () => {
	let fixture: Fixture;
	afterEach(async () => {
		vi.unstubAllEnvs();
		await fixture?.cleanup();
	});
	async function configure(url: string, env: Record<string, string> = {}) {
		fixture = await createFixture({
			'src/main.js': '',
			'package.json': '{"name":"bot","type":"module"}',
			'stars.config.mjs': `export default ${JSON.stringify({ build: { tool: 'none' }, imports: false, env: false, dev: { url, env, typecheck: false } })}`
		});
		return loadStarsConfig({ cwd: fixture.root, env: {} });
	}

	test('an explicit remote URL survives --port while the child gets the requested runtime port', async () => {
		const url = 'https://my-tunnel.example.com/bot?target=/';
		const config = await configure(url);
		const checkPort = vi.fn(async () => 'available' as const);
		const selected = await prepareDevEndpoint(config, { port: 4000, checkPort });
		expect(selected?.dev.url).toBe(url);
		expect(selected?.dev.env).toMatchObject({ HTTP_PORT: '4000', PORT: '4000', NITRO_PORT: '4000' });
		expect(checkPort.mock.calls).toEqual([[4000, '0.0.0.0']]);
		await assertChildEnv(selected!, ['4000', '4000', '4000']);
	});

	test('an explicit local proxy URL neither changes the bot listener nor gets probed', async () => {
		const config = await configure('https://localhost/proxy?target=/');
		const checkPort = vi.fn(async () => 'available' as const);
		const selected = await prepareDevEndpoint(config, { checkPort });
		expect(selected?.dev.url).toBe('https://localhost/proxy?target=/');
		expect(selected?.dev.env).toEqual({});
		expect(checkPort.mock.calls).toEqual([[3000, '0.0.0.0']]);
		vi.stubEnv('HTTP_PORT', undefined);
		vi.stubEnv('PORT', '9876');
		vi.stubEnv('NITRO_PORT', undefined);
		await assertChildEnv(selected!, [null, '9876', null]);
	});

	test.each(['https://localhost/proxy', 'https://my-tunnel.example.com/bot'])('fallback preserves the explicit URL %s', async (url) => {
		const config = await configure(url, { HTTP_PORT: '4000' });
		const checkPort = vi.fn(async (port: number) => (port === 4000 ? ('in-use' as const) : ('available' as const)));
		const selected = await prepareDevEndpoint(config, { policy: 'next', checkPort });
		expect(selected?.dev.url).toBe(url);
		expect(selected?.dev.env.HTTP_PORT).toBe('4001');
		expect(checkPort.mock.calls).toEqual([
			[4000, '0.0.0.0'],
			[4001, '0.0.0.0']
		]);
	});

	test.each(['0', 'invalid', ''])('validates configured listener port %s at dev startup and lets --port override it', async (HTTP_PORT) => {
		const config = await configure('https://localhost/proxy', { HTTP_PORT });
		await expect(prepareDevEndpoint(config, { policy: 'continue' })).rejects.toMatchObject({ code: 'INVALID_PORT' });
		const selected = await prepareDevEndpoint(config, { port: 4000, policy: 'continue' });
		expect(selected?.dev.env.HTTP_PORT).toBe('4000');
		expect(selected?.dev.url).toBe('https://localhost/proxy');
	});

	test.each(['abc', '0', ''])('build, info and doctor ignore unrelated ambient PORT=%s', async (PORT) => {
		vi.stubEnv('PORT', PORT);
		vi.stubEnv('HTTP_PORT', undefined);
		fixture = await createFixture({
			'src/main.js': '',
			'package.json': '{"name":"bot","type":"module"}',
			'node_modules/@wolfstar/http-framework/package.json':
				'{"name":"@wolfstar/http-framework","version":"6.1.0","type":"module","exports":"./index.js"}',
			'.env': 'HTTP_PORT=4000\nDISCORD_TOKEN=abc\nDISCORD_PUBLIC_KEY=def\nDISCORD_APPLICATION_ID=1\n',
			'stars.config.mjs': "export default { build: { tool: 'none' }, imports: false, env: false };"
		});
		expect(await capture((stdout) => runBuild({ cwd: fixture.root, stdout }))).toContain('nothing to build');
		const info = JSON.parse(await capture((stdout) => runInfo({ cwd: fixture.root, json: true, stdout }))) as ProjectInfo;
		expect(info.dev.url).toBe('http://localhost:4000');
		const isPortFree = vi.fn(async () => true);
		const doctor = JSON.parse(await capture((stdout) => runDoctor({ cwd: fixture.root, json: true, stdout, isPortFree }))) as {
			checks: { name: string; status: string }[];
		};
		expect(doctor.checks.find(({ name }) => name === 'port')?.status).toBe('ok');
		expect(isPortFree.mock.calls).toEqual([[4000, '0.0.0.0']]);
	});

	test('a file HTTP_PORT wins over a valid ambient generic PORT without global mutation', async () => {
		vi.stubEnv('PORT', '8080');
		vi.stubEnv('HTTP_PORT', undefined);
		fixture = await createFixture({ 'src/main.js': '', '.env': 'HTTP_PORT=4000\n' });
		const config = await loadStarsConfig({ cwd: fixture.root });
		const selected = await prepareDevEndpoint(config, { policy: 'continue' });
		expect(selected?.dev.env.HTTP_PORT).toBe('4000');
		expect(process.env.PORT).toBe('8080');
		expect(process.env.HTTP_PORT).toBeUndefined();
	});

	async function assertChildEnv(config: ResolvedStarsConfig, expected: (string | null)[]) {
		await fixture.write(
			'src/main.js',
			'console.log(JSON.stringify([process.env.HTTP_PORT,process.env.PORT,process.env.NITRO_PORT]));setInterval(() => {},1000);'
		);
		const service = new DevService(config, { builder: await createBuilder(config) });
		try {
			await service.start();
			await waitFor(() => service.logs.entries().some(({ source, text }) => source === 'app' && text === JSON.stringify(expected)));
		} finally {
			await service.stop();
		}
	}
});
