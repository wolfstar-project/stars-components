import { mkdir, symlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { PassThrough } from 'node:stream';
import { runTypecheck } from '../src/commands/typecheck.js';
import { createFixture, type Fixture } from './helpers.js';

const TYPESCRIPT_PACKAGE = dirname(createRequire(import.meta.url).resolve('typescript/package.json'));

describe('stars typecheck', () => {
	let fixture: Fixture;

	beforeEach(async () => {
		fixture = await createFixture({
			'package.json': '{"name":"bot","type":"module"}',
			'src/main.ts': 'export const total: number = 1;',
			'scripts/seed.ts': 'export const seed: number = 1;',
			'node_modules/@types/node/package.json': '{"name":"@types/node","version":"1.0.0","types":"index.d.ts"}',
			'node_modules/@types/node/index.d.ts': 'declare const process: { argv: string[] };',
			'tsconfig.json': JSON.stringify({
				files: [],
				references: [{ path: './.stars/tsconfig.app.json' }, { path: './.stars/tsconfig.node.json' }]
			}),
			'stars.config.mjs': "export default { build: { tool: 'tsdown' }, imports: false };"
		});
		await mkdir(join(fixture.root, 'node_modules'), { recursive: true });
		await symlink(TYPESCRIPT_PACKAGE, join(fixture.root, 'node_modules', 'typescript'), 'junction');
	});

	afterEach(async () => fixture.cleanup());

	function capture() {
		const stdout = new PassThrough();
		let output = '';
		stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
		return { stdout, text: () => output };
	}

	test('regenerates .stars/ and checks the app and the node project', async () => {
		const out = capture();
		await runTypecheck({ cwd: fixture.root, stdout: out.stdout });

		expect(out.text()).toContain(join('.stars', 'tsconfig.app.json'));
		expect(out.text()).toContain(join('.stars', 'tsconfig.node.json'));
		expect(out.text()).toContain('no type errors');
	});

	test('fails when either project has type errors, after checking both', async () => {
		await fixture.write('scripts/seed.ts', 'export const seed: number = "nope";');
		const out = capture();

		await expect(runTypecheck({ cwd: fixture.root, stdout: out.stdout })).rejects.toMatchObject({
			code: 'TYPECHECK_FAILED',
			message: expect.stringContaining('tsconfig.node.json')
		});
		expect(out.text()).toContain('tsconfig.app.json');
	});

	test('checks the project tsconfig and the node project of a tsc build', async () => {
		await fixture.write('stars.tsc.mjs', "export default { build: { tool: 'tsc' }, imports: false };");
		await fixture.write(
			'src/tsconfig.json',
			'{ "compilerOptions": { "strict": true, "noEmit": true, "skipLibCheck": true }, "include": ["**/*.ts"] }'
		);
		const out = capture();

		await runTypecheck({ cwd: fixture.root, config: 'stars.tsc.mjs', stdout: out.stdout });

		expect(out.text()).toContain(join('src', 'tsconfig.json'));
		expect(out.text()).toContain(join('.stars', 'tsconfig.node.json'));
		expect(out.text()).not.toContain('tsconfig.app.json');
	});
});
