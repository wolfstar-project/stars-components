import { mkdir, readFile, symlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { PassThrough } from 'node:stream';
import { runBuild } from '../src/commands/build.js';
import { createFixture, type Fixture } from './helpers.js';

const TYPESCRIPT_PACKAGE = dirname(createRequire(import.meta.url).resolve('typescript/package.json'));

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

	test('runs the hooks in the same order as stars dev', async () => {
		const hooks = ['config:resolved', 'env:options', 'builder:created', 'prepare:before', 'prepare:done', 'build:before', 'build:done'];
		const project = await createFixture({
			'package.json': JSON.stringify({ name: 'bot', type: 'module', dependencies: { '@wolfstar/env-utilities': '^2.2.1' } }),
			'src/main.ts': '',
			'tsconfig.json': '{ this is not valid json',
			'stars.config.mjs': `export default { build: { tool: 'tsc' }, imports: false, env: true, hooks: { ${hooks
				.map((name) => `'${name}'() { (globalThis.__starsHookOrder ??= []).push('${name}'); }`)
				.join(', ')} } };`
		});
		await mkdir(join(project.root, 'node_modules'), { recursive: true });
		await symlink(TYPESCRIPT_PACKAGE, join(project.root, 'node_modules', 'typescript'), 'junction');

		try {
			// The build fails fast on the malformed tsconfig, which still runs every hook up to `build:done`.
			await expect(runBuild({ cwd: project.root, stdout: new PassThrough() })).rejects.toMatchObject({ code: 'BUILD_FAILED' });
			expect((globalThis as { __starsHookOrder?: string[] }).__starsHookOrder).toEqual(hooks);
		} finally {
			delete (globalThis as { __starsHookOrder?: string[] }).__starsHookOrder;
			await project.cleanup();
		}
	});

	test('fails with an actionable error when the build itself fails', async () => {
		const broken = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.ts': '',
			// Malformed on purpose: `tsc -b` fails fast on it, without needing a real type error.
			'tsconfig.json': '{ this is not valid json',
			'stars.config.mjs': "export default { build: { tool: 'tsc' }, imports: false };"
		});
		await mkdir(join(broken.root, 'node_modules'), { recursive: true });
		await symlink(TYPESCRIPT_PACKAGE, join(broken.root, 'node_modules', 'typescript'), 'junction');

		try {
			await expect(runBuild({ cwd: broken.root, stdout: new PassThrough() })).rejects.toMatchObject({ code: 'BUILD_FAILED' });
		} finally {
			await broken.cleanup();
		}
	});
});
