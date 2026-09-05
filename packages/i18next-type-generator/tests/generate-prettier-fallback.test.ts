import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('prettier', () => ({
	resolveConfig: async () => ({}),
	format: async () => {
		throw new Error('format failed');
	}
}));

const { generate } = await import('../src/generate.js');

describe('generate prettier fallbacks', () => {
	let tempDirectory: string;
	let sourceDirectory: string;
	let destinationFile: string;

	beforeEach(async () => {
		tempDirectory = await mkdtemp(join(tmpdir(), 'i18next-type-generator-prettier-'));
		sourceDirectory = join(tempDirectory, 'locales', 'en-US');
		destinationFile = join(tempDirectory, 'output', 'i18next.d.ts');

		await mkdir(join(sourceDirectory, 'commands'), { recursive: true });
		await writeFile(join(sourceDirectory, 'commands', 'shared.json'), JSON.stringify({ hello: 'world' }));
	});

	afterEach(async () => {
		await rm(tempDirectory, { recursive: true, force: true });
	});

	test('GIVEN prettier errors THEN falls back to unformatted output', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		await generate([sourceDirectory, destinationFile], {
			verbose: false,
			oxfmt: false,
			prettier: true,
			indentation: '\t'
		});

		const output = await readFile(destinationFile, 'utf8');

		expect(output).toContain('commands/shared');
		expect(warnSpy).toHaveBeenCalled();

		warnSpy.mockRestore();
	});
});
