import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
		expect(resolveFeatureDirs({ i18n: false, subcommands: false, subcommandsAdvanced: false, testing: false })).toStrictEqual([]);
	});

	test('GIVEN i18n and subcommands enabled THEN resolves the combined subcommands-i18n directory, not the plain one', () => {
		const dirs = resolveFeatureDirs({ i18n: true, subcommands: true, subcommandsAdvanced: false, testing: false });

		expect(dirs).toContain('subcommands-i18n');
		expect(dirs).not.toContain('subcommands');
	});

	test('GIVEN subcommands enabled without i18n THEN resolves the plain subcommands directory', () => {
		const dirs = resolveFeatureDirs({ i18n: false, subcommands: true, subcommandsAdvanced: false, testing: false });

		expect(dirs).toStrictEqual(['subcommands']);
	});

	test('GIVEN i18n enabled without subcommands THEN resolves only the i18n directory', () => {
		const dirs = resolveFeatureDirs({ i18n: true, subcommands: false, subcommandsAdvanced: false, testing: false });

		expect(dirs).toStrictEqual(['i18n']);
	});

	test('GIVEN subcommandsAdvanced enabled without i18n THEN resolves the plain subcommands-advanced directory', () => {
		const dirs = resolveFeatureDirs({ i18n: false, subcommands: false, subcommandsAdvanced: true, testing: false });

		expect(dirs).toStrictEqual(['subcommands-advanced']);
	});

	test('GIVEN i18n and subcommandsAdvanced enabled THEN resolves the combined subcommands-advanced-i18n directory, not the plain one', () => {
		const dirs = resolveFeatureDirs({ i18n: true, subcommands: false, subcommandsAdvanced: true, testing: false });

		expect(dirs).toContain('subcommands-advanced-i18n');
		expect(dirs).not.toContain('subcommands-advanced');
	});

	test('GIVEN both subcommands and subcommandsAdvanced enabled THEN only resolves the advanced directory', () => {
		const dirs = resolveFeatureDirs({ i18n: false, subcommands: true, subcommandsAdvanced: true, testing: false });

		expect(dirs).toStrictEqual(['subcommands-advanced']);
	});

	test.each([
		[{ i18n: false, subcommands: false, subcommandsAdvanced: false, testing: true }],
		[{ i18n: true, subcommands: false, subcommandsAdvanced: false, testing: true }],
		[{ i18n: false, subcommands: true, subcommandsAdvanced: false, testing: true }],
		[{ i18n: true, subcommands: true, subcommandsAdvanced: false, testing: true }]
	])('GIVEN testing enabled THEN always includes the testing directory (%o)', (ctx) => {
		expect(resolveFeatureDirs(ctx)).toContain('testing');
	});

	test('GIVEN every toggle enabled THEN resolves i18n, subcommands-i18n, testing and testing-i18n in order', () => {
		const dirs = resolveFeatureDirs({ i18n: true, subcommands: true, subcommandsAdvanced: false, testing: true });

		expect(dirs).toStrictEqual(['i18n', 'subcommands-i18n', 'testing', 'testing-i18n']);
	});

	test('GIVEN testing and i18n enabled without subcommands THEN layers the testing-i18n overlay on top of testing', () => {
		const dirs = resolveFeatureDirs({ i18n: true, subcommands: false, subcommandsAdvanced: false, testing: true });

		expect(dirs).toStrictEqual(['i18n', 'testing', 'testing-i18n']);
	});

	test('GIVEN testing enabled without i18n THEN does not layer the testing-i18n overlay', () => {
		const dirs = resolveFeatureDirs({ i18n: false, subcommands: false, subcommandsAdvanced: false, testing: true });

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
			subcommandsAdvanced: false,
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

	test('GIVEN subcommandsAdvanced enabled THEN writes the settings command with subcommand groups', async () => {
		await processTemplate(outputDir, makeContext({ subcommandsAdvanced: true }));

		const settingsCommand = join(outputDir, 'src', 'commands', 'settings.ts');
		expect(existsSync(settingsCommand)).toBe(true);

		const content = await readFile(settingsCommand, 'utf8');
		expect(content).toContain('RegisterSubcommandGroup');
	});

	test('GIVEN subcommandsAdvanced and i18n enabled THEN writes the localized settings command and locale JSON', async () => {
		await processTemplate(outputDir, makeContext({ subcommandsAdvanced: true, i18n: true }));

		const localeFile = join(outputDir, 'src', 'locales', 'en-US', 'commands', 'settings.json');
		const settingsCommand = join(outputDir, 'src', 'commands', 'settings.ts');

		expect(existsSync(localeFile)).toBe(true);
		expect(existsSync(settingsCommand)).toBe(true);

		const content = await readFile(settingsCommand, 'utf8');
		expect(content).toContain('applyLocalizedBuilder');
	});

	test('GIVEN both subcommands and subcommandsAdvanced enabled THEN only writes the settings command, not math', async () => {
		await processTemplate(outputDir, makeContext({ subcommands: true, subcommandsAdvanced: true }));

		expect(existsSync(join(outputDir, 'src', 'commands', 'settings.ts'))).toBe(true);
		expect(existsSync(join(outputDir, 'src', 'commands', 'math.ts'))).toBe(false);
	});

	test('GIVEN a rerun with i18n and subcommands disabled THEN removes stale feature files and leaves no import of the dropped package', async () => {
		await processTemplate(outputDir, makeContext({ i18n: true, subcommands: true }));
		expect(existsSync(join(outputDir, 'src', 'commands', 'math.ts'))).toBe(true);
		expect(existsSync(join(outputDir, 'src', 'locales', 'en-US', 'commands', 'math.json'))).toBe(true);

		await processTemplate(outputDir, makeContext({ i18n: false, subcommands: false }));

		// The subcommands overlay's math.ts (and its i18n locale JSON) are unique to the disabled
		// features and must be removed, not just left behind with a dangling import.
		expect(existsSync(join(outputDir, 'src', 'commands', 'math.ts'))).toBe(false);
		expect(existsSync(join(outputDir, 'src', 'locales', 'en-US', 'commands', 'math.json'))).toBe(false);

		const pingContent = await readFile(join(outputDir, 'src', 'commands', 'ping.ts'), 'utf8');
		expect(pingContent).not.toContain('@wolfstar/plugin-i18next');
	});

	test('GIVEN a rerun with subcommands disabled and the generated file hand-edited THEN preserves it and reports its path', async () => {
		await processTemplate(outputDir, makeContext({ subcommands: true }));
		const mathCommand = join(outputDir, 'src', 'commands', 'math.ts');
		await writeFile(mathCommand, '// hand-edited by the user\n', 'utf8');

		const preserved = await processTemplate(outputDir, makeContext({ subcommands: false }));

		expect(existsSync(mathCommand)).toBe(true);
		expect(await readFile(mathCommand, 'utf8')).toBe('// hand-edited by the user\n');
		expect(preserved).toContain('src/commands/math.ts');
	});

	test('GIVEN a rerun with the language switched THEN removes the unmodified other-language base file', async () => {
		await processTemplate(outputDir, makeContext({ language: 'ts' }));
		expect(existsSync(join(outputDir, 'src', 'main.ts'))).toBe(true);

		const preserved = await processTemplate(outputDir, makeContext({ language: 'js' }));

		expect(existsSync(join(outputDir, 'src', 'main.ts'))).toBe(false);
		expect(existsSync(join(outputDir, 'src', 'main.js'))).toBe(true);
		expect(preserved).toStrictEqual([]);
	});

	test('GIVEN a rerun with i18n disabled AND a different port THEN still removes the pristine i18n entrypoint', async () => {
		await processTemplate(outputDir, makeContext({ i18n: true, port: 3000 }));
		const mainTs = join(outputDir, 'src', 'main.ts');
		expect(await readFile(mainTs, 'utf8')).toContain("import '@wolfstar/plugin-i18next/register';");

		// Comparing the stale file against a render with the *new* context (a different port) would
		// make this untouched file look hand-edited and wrongly preserve it — it must be compared
		// against the context that actually produced it (from the manifest) instead.
		const preserved = await processTemplate(outputDir, makeContext({ i18n: false, port: 4000 }));

		expect(preserved).toStrictEqual([]);
		const content = await readFile(mainTs, 'utf8');
		expect(content).not.toContain('@wolfstar/plugin-i18next');
		expect(content).toContain('4000');
	});

	test('GIVEN a rerun with i18n disabled THEN removes the generated i18next.d.ts declaration', async () => {
		await processTemplate(outputDir, makeContext({ i18n: true }));
		// `generate:i18n` (not processTemplate) writes this in real usage — simulate its output.
		const declaration = join(outputDir, 'src', '@types', 'i18next.d.ts');
		await mkdir(join(outputDir, 'src', '@types'), { recursive: true });
		await writeFile(declaration, 'declare module "i18next" {}\n', 'utf8');

		await processTemplate(outputDir, makeContext({ i18n: false }));

		expect(existsSync(declaration)).toBe(false);
	});

	test('GIVEN a legacy project with no manifest THEN a rerun with i18n disabled still removes the i18next.d.ts declaration', async () => {
		await processTemplate(outputDir, makeContext({ i18n: true }));
		const declaration = join(outputDir, 'src', '@types', 'i18next.d.ts');
		await mkdir(join(outputDir, 'src', '@types'), { recursive: true });
		await writeFile(declaration, 'declare module "i18next" {}\n', 'utf8');
		await rm(join(outputDir, '.create-http-framework.json'), { force: true });

		await processTemplate(outputDir, makeContext({ i18n: false }));

		expect(existsSync(declaration)).toBe(false);
	});
});
