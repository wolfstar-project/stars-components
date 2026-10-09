import { PassThrough } from 'node:stream';
import { join } from 'node:path';
import { runInfo, type ProjectInfo } from '../src/commands/info.js';
import { createFixture, type Fixture } from './helpers.js';

async function capture(run: (stdout: NodeJS.WritableStream) => Promise<void>): Promise<string> {
	const stream = new PassThrough();
	let output = '';
	stream.on('data', (chunk: Buffer) => (output += chunk.toString()));
	await run(stream);
	stream.end();
	return output;
}

describe('stars info', () => {
	let fixture: Fixture;

	afterEach(async () => {
		await fixture?.cleanup();
	});

	test('--json prints the resolved configuration', async () => {
		fixture = await createFixture({ 'src/main.js': '', 'package.json': JSON.stringify({ name: 'bot', version: '0.1.0' }) });
		const output = await capture((stdout) => runInfo({ cwd: fixture.root, json: true, stdout }));
		const info = JSON.parse(output) as ProjectInfo;

		expect(info.cli.node).toBe(process.version);
		expect(info.project).toMatchObject({
			root: fixture.root,
			name: 'bot',
			version: '0.1.0',
			configFile: null,
			entry: join(fixture.root, 'src', 'main.js')
		});
		expect(info.build.tool).toBe('none');
	});

	test('reports env, hooks and warnings', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'tsdown.config.ts': 'export default {};',
			'package.json': JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } }),
			'stars.config.mjs': "export default { future: { compatibilityVersion: 3 }, env: { prefix: 'BOT_' }, hooks: { build: { done() {} } } };"
		});
		const info = JSON.parse(await capture((stdout) => runInfo({ cwd: fixture.root, json: true, stdout }))) as ProjectInfo;
		expect(info.env).toEqual({ enabled: true, options: { prefix: 'BOT_' } });
		expect(info.hooks).toEqual(['build:done']);
		expect(info.warnings).toEqual([expect.stringMatching(/^COMPATIBILITY_VERSION_EOL: /)]);

		const output = await capture((stdout) => runInfo({ cwd: fixture.root, stdout }));
		expect(output).toContain('enabled (prefix BOT_)');
		expect(output).toContain('build:done');
		expect(output).toContain('COMPATIBILITY_VERSION_EOL');
	});

	test('reports the env options after env:options', async () => {
		fixture = await createFixture({
			'src/main.ts': '',
			'package.json': JSON.stringify({ name: 'bot', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } }),
			'stars.config.mjs':
				"export default { env: { path: '.env.original' }, hooks: { 'env:options'(options) { options.path = '.env.hooked'; } } };"
		});
		const info = JSON.parse(await capture((stdout) => runInfo({ cwd: fixture.root, json: true, stdout }))) as ProjectInfo;
		expect(info.env.options).toEqual({ path: '.env.hooked' });
	});

	test('prints a readable report with relative paths', async () => {
		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': "export default { dev: { url: 'http://localhost:3000' } };" });
		const output = await capture((stdout) => runInfo({ cwd: fixture.root, stdout }));

		expect(output).toContain('stars.config.mjs');
		expect(output).toContain('src/main.js'.replaceAll('/', join('a', 'b').includes('\\') ? '\\' : '/'));
		expect(output).toContain('http://localhost:3000');
		expect(output).toContain('none');
	});

	test.each([
		['true', 'cloudflared quick tunnel'],
		["{ provider: 'ngrok' }", 'ngrok quick tunnel'],
		["{ provider: 'ngrok', domain: 'bot.ngrok.app' }", 'ngrok quick tunnel on bot.ngrok.app'],
		["'https://bot.example.com'", 'https://bot.example.com']
	])('describes dev.tunnel %s', async (tunnel, expected) => {
		fixture = await createFixture({
			'src/main.js': '',
			'stars.config.mjs': `export default { dev: { url: 'http://localhost:3000', tunnel: ${tunnel} } };`
		});
		const output = await capture((stdout) => runInfo({ cwd: fixture.root, stdout }));

		expect(output).toContain(expected);
	});

	test('reports the production preload that tsc and none builds need for module plugins', async () => {
		fixture = await createFixture({
			'src/main.js': '',
			'node_modules/fake-module/package.json': JSON.stringify({ name: 'fake-module', type: 'module', exports: './index.js' }),
			'node_modules/fake-module/index.js':
				"export default { meta: { name: 'fake-module' }, setup: (_options, ctx) => ctx.addPlugin('fake-module/plugin') };",
			'stars.config.mjs': "export default { modules: ['fake-module'] };"
		});
		const output = await capture((stdout) => runInfo({ cwd: fixture.root, json: true, stdout }));
		const info = JSON.parse(output) as ProjectInfo;

		expect(info.warnings).toEqual([expect.stringMatching(/^MODULES_PRELOAD_REQUIRED: /)]);
	});
});
