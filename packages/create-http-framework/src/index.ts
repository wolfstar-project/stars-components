import { cancel, confirm, intro, isCancel, log, multiselect, outro, select, spinner, text } from '@clack/prompts';
import { determineAgent } from '@vercel/detect-agent';
import mri from 'mri';
import { resolve } from 'node:path';
import { directoryExists, emptyDir, isEmpty } from './tools/fileSystem.js';
import { fetchDependencyVersions } from './tools/npmHelpers.js';
import {
	BUILD_TOOLS,
	FORMATTERS,
	LANGUAGES,
	LINTERS,
	PACKAGE_MANAGERS,
	type BuildTool,
	type Formatter,
	type Language,
	type Linter
} from './tools/options.js';
import {
	detectPackageManager,
	getInstallScript,
	getRunScript,
	installDependencies,
	runCommand,
	type PackageManager
} from './tools/packageManager.js';
import { writeProjectFiles } from './tools/projectFiles.js';
import { processTemplate } from './tools/templateProcessor.js';

function isValidPackageName(name: string): boolean {
	return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name);
}

function toValidPackageName(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/^[._]+/, '')
		.replace(/[^a-z0-9-._~]/g, '-');
}

function printHelp(): void {
	process.stdout.write(`
Usage: create-http-framework [project-name] [options]

Options:
  --overwrite                  Overwrite target directory if it already exists
  --no-interactive             Skip all prompts and use defaults / flags
  --interactive, -i            Force interactive prompts even when an AI agent is detected
  --package-manager <pm>       npm | yarn | pnpm | bun (defaults to the detected one)
  --language <lang>            ts | js (default: ts)
  --build <tool>               tsc6 | tsc7 | tsdown — TypeScript only (default: tsdown)
  --lint <linter>              none | eslint | oxlint (default: oxlint)
  --format <formatter>         none | prettier | oxfmt (default: oxfmt)
  --port <number>              HTTP port (default: 3000)
  --i18n / --no-i18n           Toggle @wolfstar/plugin-i18next (default: off)
  --subcommands / --no-subcommands  Toggle the subcommands example command (default: off)
  --testing / --no-testing     Toggle the testing setup (vitest) (default: off)
  --install / --no-install     Toggle dependency installation (default: on)
  --ignore                     Write into an existing, non-empty directory without clearing it
  --help, -h                   Print this message and exit

`);
	process.exit(0);
}

function parseEnum<T extends string>(value: string | undefined, allowed: readonly T[], label: string): T | undefined {
	if (value === undefined) return undefined;
	if (!(allowed as readonly string[]).includes(value)) {
		cancel(`Invalid ${label} "${value}". Expected one of: ${allowed.join(', ')}.`);
		process.exit(1);
	}
	return value as T;
}

async function main(): Promise<void> {
	const argv = mri(process.argv.slice(2), {
		boolean: ['overwrite', 'ignore', 'help'],
		string: ['package-manager', 'language', 'build', 'lint', 'format', 'port'],
		alias: { h: 'help', i: 'interactive' },
		default: { install: true }
	});

	if (argv['help']) {
		printHelp();
		return;
	}

	const argProjectName = argv._[0] as string | undefined;
	const flagOverwrite = argv['overwrite'] as boolean;
	const flagIgnore = argv['ignore'] as boolean;
	const flagInteractive = argv['interactive'] as boolean | undefined;

	const cliPackageManager = parseEnum(argv['package-manager'] as string | undefined, PACKAGE_MANAGERS, '--package-manager');
	const cliLanguage = parseEnum(argv['language'] as string | undefined, LANGUAGES, '--language');
	const cliBuild = parseEnum(argv['build'] as string | undefined, BUILD_TOOLS, '--build');
	const cliLint = parseEnum(argv['lint'] as string | undefined, LINTERS, '--lint');
	const cliFormat = parseEnum(argv['format'] as string | undefined, FORMATTERS, '--format');
	const cliPort = argv['port'] as string | undefined;
	const cliI18n = argv['i18n'] as boolean | undefined;
	const cliSubcommands = argv['subcommands'] as boolean | undefined;
	const cliTesting = argv['testing'] as boolean | undefined;
	const cliInstall = argv['install'] as boolean;

	// Detect whether a known AI agent is driving this session
	const { isAgent, agent } = await determineAgent();
	const agentMode = isAgent && flagInteractive !== true;

	// Non-interactive when explicitly requested (--no-interactive) or when an agent is driving.
	const nonInteractive = flagInteractive === false || agentMode;

	intro('Welcome to the WolfStar HTTP Framework!');

	if (agentMode && flagInteractive !== false) {
		log.info(`AI agent detected (${agent.name}) — running in non-interactive mode`);
	}

	const detectedPackageManager = await detectPackageManager();

	// ── Project name ──────────────────────────────────────────────────────────
	let projectName: string;

	if (nonInteractive) {
		if (!argProjectName) {
			cancel('A project name argument is required in non-interactive mode.');
			process.exit(1);
		}
		const normalized = isValidPackageName(argProjectName) ? argProjectName : toValidPackageName(argProjectName);
		if (!normalized || !isValidPackageName(normalized)) {
			cancel('Provide a valid npm-compatible project name in non-interactive mode.');
			process.exit(1);
		}
		projectName = normalized;
	} else {
		const suggested = argProjectName ? toValidPackageName(argProjectName) : '';
		const nameResult = await text({
			message: 'What is the name of your project?',
			placeholder: 'my-discord-bot',
			initialValue: argProjectName && isValidPackageName(argProjectName) ? argProjectName : suggested,
			validate(value) {
				if (!value) return 'Project name cannot be empty.';
				if (!isValidPackageName(value)) return 'Use lowercase letters, numbers, dashes, dots, or underscores (npm-compatible).';
				return undefined;
			}
		});
		if (isCancel(nameResult)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		projectName = nameResult;
	}

	// ── Package manager ───────────────────────────────────────────────────────
	let packageManager: PackageManager;

	if (nonInteractive) {
		packageManager = cliPackageManager ?? detectedPackageManager;
	} else {
		const pmResult = await select({
			message: 'Which package manager would you like to use?',
			options: PACKAGE_MANAGERS.map((pm) => ({ value: pm, label: pm })),
			initialValue: (PACKAGE_MANAGERS as readonly string[]).includes(detectedPackageManager) ? detectedPackageManager : 'npm'
		});
		if (isCancel(pmResult)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		packageManager = pmResult as PackageManager;
	}

	// ── Directory exists handling ─────────────────────────────────────────────
	const targetDir = resolve(projectName);

	if (directoryExists(targetDir) && !isEmpty(targetDir)) {
		if (flagOverwrite) {
			emptyDir(targetDir);
		} else if (flagIgnore) {
			// Write into the existing directory without clearing it first.
		} else if (nonInteractive) {
			cancel(`"${projectName}" already exists. Use --overwrite to overwrite it, or --ignore to write into it without clearing it first.`);
			process.exit(1);
		} else {
			const choice = await select({
				message: `"${projectName}" already exists. What would you like to do?`,
				options: [
					{ value: 'overwrite', label: 'Overwrite the directory (empties it first)' },
					{ value: 'ignore', label: 'Write into it without clearing existing files' },
					{ value: 'cancel', label: 'Cancel' }
				]
			});
			if (isCancel(choice) || choice === 'cancel') {
				cancel('Operation cancelled.');
				process.exit(0);
			}
			if (choice === 'overwrite') emptyDir(targetDir);
		}
	}

	// ── Port ──────────────────────────────────────────────────────────────────
	let port: number;

	if (nonInteractive) {
		port = cliPort === undefined ? 3000 : Number(cliPort);
		if (!Number.isInteger(port) || port < 1 || port > 65535) {
			cancel('Provide a valid --port between 1 and 65535.');
			process.exit(1);
		}
	} else {
		const portResult = await text({
			message: 'Which port should the HTTP server listen on?',
			placeholder: '3000',
			initialValue: '3000',
			validate(value) {
				const n = Number(value);
				if (!value || Number.isNaN(n) || !Number.isInteger(n) || n < 1 || n > 65535) {
					return 'Enter a valid port number (1–65535).';
				}
				return undefined;
			}
		});
		if (isCancel(portResult)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		port = Number(portResult);
	}

	// ── Language ──────────────────────────────────────────────────────────────
	let language: Language;

	if (nonInteractive) {
		language = cliLanguage ?? 'ts';
	} else {
		const languageResult = await select({
			message: 'Which language would you like to use?',
			options: [
				{ value: 'ts', label: 'TypeScript' },
				{ value: 'js', label: 'JavaScript' }
			],
			initialValue: 'ts'
		});
		if (isCancel(languageResult)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		language = languageResult as Language;
	}

	// ── Build tool (TypeScript only) ──────────────────────────────────────────
	// For JavaScript there is no compile step; buildTool is carried but unused.
	let buildTool: BuildTool = 'tsdown';

	if (cliBuild !== undefined && language === 'js') {
		log.warn('--build only applies to TypeScript projects and will be ignored.');
	}

	if (language === 'ts') {
		if (nonInteractive) {
			buildTool = cliBuild ?? 'tsdown';
		} else {
			const buildResult = await select({
				message: 'Which build tool would you like to use?',
				options: [
					{ value: 'tsdown', label: 'tsdown (bundler)' },
					{ value: 'tsc6', label: 'TypeScript 6.0 (tsc)' },
					{ value: 'tsc7', label: 'TypeScript 7.0 rc (tsc)' }
				],
				initialValue: 'tsdown'
			});
			if (isCancel(buildResult)) {
				cancel('Operation cancelled.');
				process.exit(0);
			}
			buildTool = buildResult as BuildTool;
		}
	}

	// ── Linter ────────────────────────────────────────────────────────────────
	let linter: Linter;

	if (nonInteractive) {
		linter = cliLint ?? 'oxlint';
	} else {
		const lintResult = await select({
			message: 'Which linter would you like to use?',
			options: [
				{ value: 'oxlint', label: 'oxlint' },
				{ value: 'eslint', label: 'ESLint' },
				{ value: 'none', label: 'None' }
			],
			initialValue: 'oxlint'
		});
		if (isCancel(lintResult)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		linter = lintResult as Linter;
	}

	// ── Formatter ─────────────────────────────────────────────────────────────
	let formatter: Formatter;

	if (nonInteractive) {
		formatter = cliFormat ?? 'oxfmt';
	} else {
		const formatResult = await select({
			message: 'Which formatter would you like to use?',
			options: [
				{ value: 'oxfmt', label: 'oxfmt' },
				{ value: 'prettier', label: 'Prettier' },
				{ value: 'none', label: 'None' }
			],
			initialValue: 'oxfmt'
		});
		if (isCancel(formatResult)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		formatter = formatResult as Formatter;
	}

	// ── Optional features ────────────────────────────────────────────────────
	let wantsI18n: boolean;
	let wantsSubcommands: boolean;
	let wantsTesting: boolean;

	if (nonInteractive) {
		wantsI18n = cliI18n ?? false;
		wantsSubcommands = cliSubcommands ?? false;
		wantsTesting = cliTesting ?? false;
	} else {
		const featuresResult = await multiselect({
			message: 'Which optional features would you like to add?',
			options: [
				{ value: 'i18n', label: 'i18n support (@wolfstar/plugin-i18next)' },
				{ value: 'subcommands', label: 'Subcommands example command' },
				{ value: 'testing', label: 'Testing setup (vitest)' }
			],
			initialValues: [],
			required: false
		});
		if (isCancel(featuresResult)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		const features = new Set(featuresResult as string[]);
		wantsI18n = features.has('i18n');
		wantsSubcommands = features.has('subcommands');
		wantsTesting = features.has('testing');
	}

	// ── Install ───────────────────────────────────────────────────────────────
	let wantsInstall: boolean;

	if (nonInteractive) {
		wantsInstall = cliInstall;
	} else {
		const installResult = await confirm({
			message: `Would you like to automatically install dependencies with ${packageManager}?`,
			initialValue: true
		});
		if (isCancel(installResult)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		wantsInstall = Boolean(installResult);
	}

	// ── Fetch versions (parallel) ─────────────────────────────────────────────
	const s = spinner();

	s.start('Fetching latest dependency versions...');
	const versions = await fetchDependencyVersions({
		i18n: wantsI18n,
		subcommands: wantsSubcommands,
		testing: wantsTesting,
		language,
		buildTool,
		linter,
		formatter
	});
	s.stop('Versions fetched.');

	// ── Generate files ────────────────────────────────────────────────────────
	s.start('Generating project files...');
	await processTemplate(targetDir, {
		name: projectName,
		port,
		language,
		i18n: wantsI18n,
		subcommands: wantsSubcommands,
		testing: wantsTesting
	});
	writeProjectFiles(targetDir, {
		name: projectName,
		port,
		i18n: wantsI18n,
		subcommands: wantsSubcommands,
		testing: wantsTesting,
		packageManager,
		language,
		buildTool,
		linter,
		formatter,
		versions
	});
	s.stop('Project files generated.');

	// ── Generate i18n types ───────────────────────────────────────────────────
	if (wantsI18n) {
		try {
			s.start('Generating i18n types...');
			runCommand('npx', ['--yes', '@wolfstar/i18next-type-generator', './src/locales/en-US', './src/@types/i18next.d.ts'], targetDir);
			s.stop('i18n types generated.');
		} catch {
			s.stop('Skipped i18n type generation (run it manually once dependencies are installed).');
		}
	}

	// ── Format generated files ────────────────────────────────────────────────
	if (formatter !== 'none') {
		try {
			s.start('Formatting project files...');
			if (formatter === 'oxfmt') runCommand('npx', ['--yes', 'oxfmt', '--write', '.'], targetDir);
			else runCommand('npx', ['--yes', 'prettier', '--write', '.', '--log-level', 'warn'], targetDir);
			s.stop('Project files formatted.');
		} catch {
			s.stop('Skipped formatting (formatter not available yet — it will run after install).');
		}
	}

	// ── Install dependencies ──────────────────────────────────────────────────
	if (wantsInstall) {
		s.start(`Installing dependencies with ${packageManager}...`);
		await installDependencies(packageManager, targetDir);
		s.stop('Dependencies installed.');
	}

	const extraNotes: string[] = [];
	if (wantsI18n) extraNotes.push(`  After editing locale files, regenerate i18next types with: ${getRunScript(packageManager, 'generate:i18n')}`);
	if (wantsTesting) extraNotes.push(`  Run the test suite with: ${getRunScript(packageManager, 'test')}`);

	outro(
		`Done! To get started:\n\n  cd ${projectName}\n${wantsInstall ? '' : `  ${getInstallScript(packageManager)}\n`}  ${getRunScript(packageManager, 'dev')}${extraNotes.length ? `\n\n${extraNotes.join('\n')}` : ''}`
	);
}

main().catch((error: unknown) => {
	cancel(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
