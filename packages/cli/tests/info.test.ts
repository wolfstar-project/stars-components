import { PassThrough } from 'node:stream';
import { join } from 'node:path';
import { runInfo, type ProjectInfo } from '../src/lib/tasks/info.js';
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

	test('prints a readable report with relative paths', async () => {
		fixture = await createFixture({ 'src/main.js': '', 'stars.config.mjs': "export default { dev: { url: 'http://localhost:3000' } };" });
		const output = await capture((stdout) => runInfo({ cwd: fixture.root, stdout }));

		expect(output).toContain('stars.config.mjs');
		expect(output).toContain('src/main.js'.replaceAll('/', join('a', 'b').includes('\\') ? '\\' : '/'));
		expect(output).toContain('http://localhost:3000');
		expect(output).toContain('none');
	});
});
