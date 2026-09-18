import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { runBuild } from '../src/commands/build.js';
import { createFixture, type Fixture } from './helpers.js';

describe('runBuild', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.js': '',
			'stars.config.mjs': "export default { build: { tool: 'none' }, imports: false };"
		});
	});

	afterEach(async () => fixture.cleanup());

	test('prepares the project and has nothing to build when build.tool is none', async () => {
		const stdout = new PassThrough();
		let output = '';
		stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));

		await runBuild({ cwd: fixture.root, stdout });

		expect(output).toContain('nothing to build');
		await expect(readFile(join(fixture.root, '.stars/tsconfig.json'), 'utf-8')).resolves.toContain('compilerOptions');
	});
});
