import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { processTemplate, resolveFeatureDirs, type TemplateContext } from '../src/tools/templateProcessor.js';

// `templateProcessor.ts` locates `template/` via
// `join(fileURLToPath(import.meta.url), '../..', 'template')`, which only lands on the package
// root when this module ends up bundled into a single `dist/index.js` (confirmed: tsdown bundles
// the whole CLI into one file, no `dist/tools/` subfolder survives). Importing the raw
// `src/tools/templateProcessor.ts` directly — as this test does — sits one directory level
// deeper, so the same arithmetic resolves to `src/template` instead of the real `template/`
// directory. Mock `fileURLToPath` to report the module living at the bundled location, matching
// how it actually resolves in production, without touching production code or the real repo tree.
vi.mock('node:url', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:url')>();
	return {
		...actual,
		fileURLToPath: (url: string | URL) => {
			const real = actual.fileURLToPath(url);
			return real.endsWith('/src/tools/templateProcessor.ts') ? real.replace('/src/tools/templateProcessor.ts', '/dist/index.js') : real;
		}
	};
});

describe('resolveFeatureDirs', () => {
	test('GIVEN nothing enabled THEN returns an empty array', () => {
		expect(resolveFeatureDirs({ i18n: false, subcommands: false, testing: false })).toStrictEqual([]);
	});

	test('GIVEN i18n and subcommands enabled THEN resolves the combined subcommands-i18n directory, not the plain one', () => {
		const dirs = resolveFeatureDirs({ i18n: true, subcommands: true, testing: false });

		expect(dirs).toContain('subcommands-i18n');
		expect(dirs).not.toContain('subcommands');
	});

	test('GIVEN subcommands enabled without i18n THEN resolves the plain subcommands directory', () => {
		const dirs = resolveFeatureDirs({ i18n: false, subcommands: true, testing: false });

		expect(dirs).toStrictEqual(['subcommands']);
	});

	test('GIVEN i18n enabled without subcommands THEN resolves only the i18n directory', () => {
		const dirs = resolveFeatureDirs({ i18n: true, subcommands: false, testing: false });

		expect(dirs).toStrictEqual(['i18n']);
	});

	test.each([
		[{ i18n: false, subcommands: false, testing: true }],
		[{ i18n: true, subcommands: false, testing: true }],
		[{ i18n: false, subcommands: true, testing: true }],
		[{ i18n: true, subcommands: true, testing: true }]
	])('GIVEN testing enabled THEN always includes the testing directory (%o)', (ctx) => {
		expect(resolveFeatureDirs(ctx)).toContain('testing');
	});

	test('GIVEN every toggle enabled THEN resolves i18n, subcommands-i18n, testing and testing-i18n in order', () => {
		const dirs = resolveFeatureDirs({ i18n: true, subcommands: true, testing: true });

		expect(dirs).toStrictEqual(['i18n', 'subcommands-i18n', 'testing', 'testing-i18n']);
	});

	test('GIVEN testing and i18n enabled without subcommands THEN layers the testing-i18n overlay on top of testing', () => {
		const dirs = resolveFeatureDirs({ i18n: true, subcommands: false, testing: true });

		expect(dirs).toStrictEqual(['i18n', 'testing', 'testing-i18n']);
	});

	test('GIVEN testing enabled without i18n THEN does not layer the testing-i18n overlay', () => {
		const dirs = resolveFeatureDirs({ i18n: false, subcommands: false, testing: true });

		expect(dirs).not.toContain('testing-i18n');
	});
});

describe('processTemplate', () => {
	let outputDir: string;

	beforeEach(async () => {
		outputDir = await mkdtemp(join(tmpdir(), 'create-http-framework-template-'));
	});

	afterEach(async () => {
		await rm(outputDir, { recursive: true, force: true });
	});

	function makeContext(overrides: Partial<TemplateContext> = {}): TemplateContext {
		return {
			name: 'test-project',
			port: 3000,
			language: 'ts',
			i18n: false,
			subcommands: false,
			testing: false,
			...overrides
		};
	}

	test('GIVEN i18n enabled THEN writes the localized ping command and locale JSON', async () => {
		await processTemplate(outputDir, makeContext({ i18n: true }));

		const localeFile = join(outputDir, 'src', 'locales', 'en-US', 'commands', 'ping.json');
		const pingCommand = join(outputDir, 'src', 'commands', 'ping.ts');

		expect(existsSync(localeFile)).toBe(true);
		expect(existsSync(pingCommand)).toBe(true);

		const content = await readFile(pingCommand, 'utf8');
		expect(content).toContain('applyLocalizedBuilder');
	});

	test('GIVEN i18n disabled THEN does not write locale files and the ping command has no localization', async () => {
		await processTemplate(outputDir, makeContext({ i18n: false }));

		const localeFile = join(outputDir, 'src', 'locales', 'en-US', 'commands', 'ping.json');
		const pingCommand = join(outputDir, 'src', 'commands', 'ping.ts');

		expect(existsSync(localeFile)).toBe(false);
		expect(existsSync(pingCommand)).toBe(true);

		const content = await readFile(pingCommand, 'utf8');
		expect(content).not.toContain('applyLocalizedBuilder');
	});
});
