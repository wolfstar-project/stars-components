import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { generateAutoImportsDts } from '../src/auto-imports.js';

async function createFixture(files: Record<string, string>): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'stars-auto-imports-'));
	for (const [path, content] of Object.entries(files)) {
		const file = join(root, path);
		await mkdir(dirname(file), { recursive: true });
		await writeFile(file, content);
	}

	return root;
}

describe('generateAutoImportsDts', () => {
	let root: string | undefined;

	afterEach(async () => {
		if (root) await rm(root, { recursive: true, force: true });
		root = undefined;
	});

	test('GIVEN a scaffolded setup() and the env-utilities preset THEN only the project setup() is auto-imported', async () => {
		root = await createFixture({
			'package.json': JSON.stringify({ name: 'fixture', type: 'module' }),
			'node_modules/@wolfstar/env-utilities/package.json': JSON.stringify({
				name: '@wolfstar/env-utilities',
				type: 'module',
				exports: { '.': './index.js' }
			}),
			'node_modules/@wolfstar/env-utilities/index.js': 'export function setup() {}\nexport function envParseString() {}\n',
			'src/lib/setup/all.ts': 'export function setup() {}\n'
		});

		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const dts = await generateAutoImportsDts({
			root,
			dirs: [join(root, 'src/lib/**')],
			presets: ['@wolfstar/env-utilities'],
			exclude: []
		});

		expect(dts).toContain("envParseString: typeof import('@wolfstar/env-utilities').envParseString");
		expect(dts).not.toContain("typeof import('@wolfstar/env-utilities').setup");
		expect(dts).toMatch(/setup: typeof import\('.+\/src\/lib\/setup\/all(\.ts)?'\)\.setup/);
		expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('Duplicated imports'));
		warn.mockRestore();
	});
});
