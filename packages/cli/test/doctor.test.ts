import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { collectChecks, formatChecks, runDoctor, type Check } from '../src/commands/doctor.js';
import { loadProject } from '../src/utils/hooks.js';
import { createFixture, type Fixture } from './helpers.js';

const NGROK_PACKAGE = '{"name":"@ngrok/ngrok","version":"1.7.0"}';
const FRAMEWORK = (version: string) => JSON.stringify({ name: '@wolfstar/http-framework', version, type: 'module', exports: './index.js' });

describe('stars doctor', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	async function check(files: Record<string, string>, options: Parameters<typeof collectChecks>[2] = {}) {
		fixture = await createFixture({ 'src/main.js': '', ...files });
		const { config, hooks } = await loadProject({ cwd: fixture.root, env: {} });
		const checks = await collectChecks(config, hooks, { env: {}, isPortFree: () => Promise.resolve(true), ...options });
		return Object.fromEntries(checks.map((entry) => [entry.name, entry])) as Record<string, Check>;
	}

	test('a ready project passes every check', async () => {
		const checks = await check({
			'node_modules/@wolfstar/http-framework/package.json': FRAMEWORK('6.1.0'),
			'.env': 'DISCORD_TOKEN=abc\nDISCORD_PUBLIC_KEY=def\nDISCORD_APPLICATION_ID=1\n',
			'stars.config.mjs': "export default { dev: { tunnel: 'https://bot.example.com' } };"
		});

		expect(checks.node).toMatchObject({ status: 'ok' });
		expect(checks.config).toMatchObject({ status: 'ok', message: 'stars.config.mjs' });
		expect(checks.framework).toMatchObject({ status: 'ok', message: '@wolfstar/http-framework v6.1.0' });
		expect(checks.entry).toMatchObject({ status: 'ok', message: `${join('src', 'main.js')} (none)` });
		expect(checks.token).toMatchObject({ status: 'ok' });
		expect(checks['public key']).toMatchObject({ status: 'ok' });
		expect(checks.port).toMatchObject({ status: 'ok' });
		expect(checks.tunnel).toMatchObject({ status: 'ok', message: 'https://bot.example.com' });
		expect(checks.prepare).toBeDefined();
		expect(checks.application).toBeUndefined();
	});

	test('flags a root tsconfig.json that still extends the single generated one from compatibility version 6', async () => {
		const files = { 'src/main.ts': '', 'stars.config.mjs': 'export default {};' };
		const legacy = await check({ ...files, 'tsconfig.json': '{ "extends": "./.stars/tsconfig.json" }' });
		expect(legacy.tsconfig).toMatchObject({ status: 'warn', fix: expect.stringContaining('.stars/tsconfig.app.json') });
		await fixture.cleanup();

		const solution = await check({
			...files,
			'tsconfig.json': '{ "files": [], "references": [{ "path": "./.stars/tsconfig.app.json" }] }'
		});
		expect(solution.tsconfig).toBeUndefined();
		await fixture.cleanup();

		const five = await check({
			...files,
			'tsconfig.json': '{ "extends": "./.stars/tsconfig.json" }',
			'stars.config.mjs': 'export default { future: { compatibilityVersion: 5 } };'
		});
		expect(five.tsconfig).toBeUndefined();
	});

	test('lists both outdated generated tsconfigs', async () => {
		const checks = await check({ 'src/main.ts': '', 'stars.config.mjs': 'export default { imports: false };' });
		expect(checks.prepare).toMatchObject({ status: 'warn' });
		expect(checks.prepare!.message).toContain('tsconfig.app.json');
		expect(checks.prepare!.message).toContain('tsconfig.node.json');
	});

	test('says what is missing and how to fix it', async () => {
		const checks = await check(
			{ 'package.json': JSON.stringify({ name: 'bot', engines: { node: '>=99' } }) },
			{ nodeVersion: 'v20.11.0', isPortFree: () => Promise.resolve(false) }
		);

		expect(checks.node).toMatchObject({ status: 'error', fix: 'Use Node.js 22 or later.' });
		expect(checks.engines).toMatchObject({ status: 'warn', message: expect.stringContaining('>=99') });
		expect(checks.config).toMatchObject({ message: 'no stars.config, running on defaults' });
		expect(checks.framework).toMatchObject({ status: 'error', fix: expect.stringContaining('Install') });
		expect(checks.token).toMatchObject({ status: 'error' });
		expect(checks['public key']).toMatchObject({ status: 'warn' });
		expect(checks.port).toMatchObject({ status: 'warn', message: expect.stringContaining('http://localhost:3000') });
		expect(checks.tunnel).toMatchObject({ status: 'info', fix: expect.stringContaining('dev.tunnel') });
	});

	test('warns about a framework too old for the dev bridge and a token without an application id', async () => {
		const checks = await check(
			{
				'node_modules/@wolfstar/http-framework/package.json': FRAMEWORK('6.0.0'),
				'stars.config.mjs': 'export default { dev: { tunnel: true } };'
			},
			{ env: { DISCORD_TOKEN: 'abc', PATH: '' } }
		);

		expect(checks.framework).toMatchObject({ status: 'warn', fix: expect.stringContaining('6.1.0') });
		expect(checks.application).toMatchObject({ status: 'warn' });
		expect(checks.tunnel).toMatchObject({ status: 'info', message: expect.stringContaining('downloaded') });
	});

	test.each([
		['the package is missing', {}, {}, 'warn', '@ngrok/ngrok is not installed'],
		['the authtoken is missing', { 'node_modules/@ngrok/ngrok/package.json': NGROK_PACKAGE }, {}, 'warn', 'NGROK_AUTHTOKEN is not set'],
		[
			'it is ready',
			{ 'node_modules/@ngrok/ngrok/package.json': NGROK_PACKAGE },
			{ NGROK_AUTHTOKEN: 'abc' },
			'ok',
			'ngrok quick tunnel on bot.ngrok.app'
		]
	])('checks the prerequisites of the ngrok tunnel: %s', async (_name, files, env, status, message) => {
		const checks = await check(
			{ ...files, 'stars.config.mjs': "export default { dev: { tunnel: { provider: 'ngrok', domain: 'bot.ngrok.app' } } };" },
			{ env }
		);

		expect(checks.tunnel).toMatchObject({ status, message: expect.stringContaining(message) });
		if (status === 'warn') expect(checks.tunnel!.fix).toBeDefined();
	});

	test('--online asks Discord where the application sends interactions', async () => {
		const answer = (status: number, body: unknown) => (() => Promise.resolve(new Response(JSON.stringify(body), { status }))) as typeof fetch;
		const files = { 'stars.config.mjs': "export default { dev: { tunnel: 'https://bot.example.com' } };" };
		const env = { DISCORD_TOKEN: 'abc' };

		const ok = await check(files, {
			env,
			online: true,
			fetch: answer(200, { name: 'Seed', interactions_endpoint_url: 'https://bot.example.com/' })
		});
		expect(ok.discord).toMatchObject({ status: 'ok', message: 'Seed sends interactions to https://bot.example.com/' });
		await fixture.cleanup();

		const elsewhere = await check(files, {
			env,
			online: true,
			fetch: answer(200, { name: 'Seed', interactions_endpoint_url: 'https://old.example.com/' })
		});
		expect(elsewhere.discord).toMatchObject({ status: 'warn', message: expect.stringContaining('not to https://bot.example.com') });
		await fixture.cleanup();

		// The same prefix is not the same endpoint: another path, or a host that only starts alike.
		for (const url of ['https://bot.example.com/other', 'https://bot.example.com.evil.test/']) {
			const prefixed = await check(files, { env, online: true, fetch: answer(200, { name: 'Seed', interactions_endpoint_url: url }) });
			expect(prefixed.discord, url).toMatchObject({ status: 'warn' });
			await fixture.cleanup();
		}

		const withPath = { 'stars.config.mjs': "export default { dev: { tunnel: { url: 'https://bot.example.com', path: '/interactions' } } };" };
		const matching = await check(withPath, {
			env,
			online: true,
			fetch: answer(200, { name: 'Seed', interactions_endpoint_url: 'https://bot.example.com/interactions/' })
		});
		expect(matching.discord).toMatchObject({ status: 'ok' });
		await fixture.cleanup();
		const root = await check(withPath, {
			env,
			online: true,
			fetch: answer(200, { name: 'Seed', interactions_endpoint_url: 'https://bot.example.com/' })
		});
		expect(root.discord).toMatchObject({ status: 'warn', message: expect.stringContaining('not to https://bot.example.com/interactions') });
		await fixture.cleanup();

		const unset = await check(files, { env, online: true, fetch: answer(200, { name: 'Seed', interactions_endpoint_url: null }) });
		expect(unset.discord).toMatchObject({ status: 'warn', message: 'Seed has no interactions endpoint URL' });
		await fixture.cleanup();

		const rejected = await check(files, { env, online: true, fetch: answer(401, {}) });
		expect(rejected.discord).toMatchObject({ status: 'error', fix: 'Check DISCORD_TOKEN.' });
		await fixture.cleanup();

		const offline = await check(files, { env, online: true, fetch: (() => Promise.reject(new Error('getaddrinfo ENOTFOUND'))) as typeof fetch });
		expect(offline.discord).toMatchObject({ status: 'warn', message: expect.stringContaining('ENOTFOUND') });
	});

	test('prints a report, --json for scripts, and fails when a check does', async () => {
		fixture = await createFixture({ 'src/main.js': '' });
		const run = async (json: boolean) => {
			const stdout = new PassThrough();
			let output = '';
			stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
			const error = await runDoctor({ cwd: fixture.root, json, stdout, env: {}, isPortFree: () => Promise.resolve(true) }).catch(
				(caught: unknown) => caught
			);
			return { output, error };
		};

		const report = await run(false);
		expect(report.output).toContain('stars doctor');
		expect(report.output).toContain('✖ framework');
		expect(report.output).toContain('→ Install @wolfstar/http-framework in the project.');
		expect(report.error).toMatchObject({ code: 'DOCTOR_FAILED' });

		const json = JSON.parse((await run(true)).output) as { ok: boolean; checks: Check[] };
		expect(json.ok).toBe(false);
		expect(json.checks.find((entry) => entry.name === 'token')).toMatchObject({ status: 'error' });
	});

	test('formatChecks aligns the names and counts the outcome', () => {
		const output = formatChecks(
			[
				{ name: 'node', status: 'ok', message: 'Node.js v24' },
				{ name: 'public key', status: 'warn', message: 'not set', fix: 'Set it.' }
			],
			false
		);
		expect(output).toContain('  ✔ node        Node.js v24');
		expect(output).toContain('  ⚠ public key  not set');
		expect(output).toContain('→ Set it.');
		expect(output).toContain('no errors, 1 warning(s)');
	});
});
