import { cancel, confirm, intro, isCancel, log, outro, select, spinner, text } from '@clack/prompts';
import { determineAgent } from '@vercel/detect-agent';
import mri from 'mri';
import { resolve } from 'node:path';
import { directoryExists, emptyDir, isEmpty } from './tools/fileSystem.js';
import { fetchDependencyVersions } from './tools/npmHelpers.js';
import { detectPackageManager, installDependencies } from './tools/packageManager.js';
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
  --overwrite        Overwrite target directory if it already exists
  --yes, -y          Skip prompts and use defaults (port 3000, no i18n, auto-install)
  --interactive, -i  Force interactive prompts even when an AI agent is detected
  --help, -h         Print this message and exit

`);
	process.exit(0);
}

async function main(): Promise<void> {
	const argv = mri(process.argv.slice(2), {
		boolean: ['overwrite', 'yes', 'help', 'interactive'],
		alias: { y: 'yes', h: 'help', i: 'interactive' }
	});

	if (argv['help']) {
		printHelp();
		return;
	}

	const argProjectName = argv._[0] as string | undefined;
	const flagOverwrite = argv['overwrite'] as boolean;
	const flagYes = argv['yes'] as boolean;
	const flagInteractive = argv['interactive'] as boolean;

	// Detect whether a known AI agent is driving this session
	const { isAgent, agent } = await determineAgent();
	const agentMode = isAgent && !flagInteractive;

	// In agent mode, behave as if --yes was passed (skip all interactive prompts)
	const effectiveYes = flagYes || agentMode;

	intro('Welcome to the WolfStar HTTP Framework!');

	if (agentMode && !flagYes) {
		log.info(`AI agent detected (${agent.name}) — running in non-interactive mode`);
	}

	const packageManager = await detectPackageManager();

	// ── Project name ──────────────────────────────────────────────────────────
	let projectName: string;

	if (effectiveYes) {
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

	// ── Directory exists handling ─────────────────────────────────────────────
	const targetDir = resolve(projectName);

	if (directoryExists(targetDir) && !isEmpty(targetDir)) {
		if (flagOverwrite) {
			emptyDir(targetDir);
		} else if (effectiveYes) {
			cancel(`"${projectName}" already exists. Use --overwrite to overwrite it.`);
			process.exit(1);
		} else {
			const choice = await select({
				message: `"${projectName}" already exists. What would you like to do?`,
				options: [
					{ value: 'overwrite', label: 'Overwrite the directory' },
					{ value: 'cancel', label: 'Cancel' }
				]
			});
			if (isCancel(choice) || choice === 'cancel') {
				cancel('Operation cancelled.');
				process.exit(0);
			}
			emptyDir(targetDir);
		}
	}

	// ── Port ──────────────────────────────────────────────────────────────────
	let port: number;

	if (effectiveYes) {
		port = 3000;
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

	// ── i18n ──────────────────────────────────────────────────────────────────
	let wantsI18n: boolean;

	if (effectiveYes) {
		wantsI18n = false;
	} else {
		const i18nResult = await confirm({
			message: 'Would you like to add i18n support? (@wolfstar/http-framework-i18n)',
			initialValue: false
		});
		if (isCancel(i18nResult)) {
			cancel('Operation cancelled.');
			process.exit(0);
		}
		wantsI18n = Boolean(i18nResult);
	}

	// ── Install ───────────────────────────────────────────────────────────────
	let wantsInstall: boolean;

	if (effectiveYes) {
		wantsInstall = true;
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
	const versions = await fetchDependencyVersions();
	s.stop('Versions fetched.');

	// ── Generate files ────────────────────────────────────────────────────────
	s.start('Generating project files...');
	processTemplate(targetDir, {
		name: projectName,
		port,
		i18n: wantsI18n,
		packageManager,
		todaysDate: new Date().toISOString().split('T')[0]!,
		versions
	});
	s.stop('Project files generated.');

	// ── Install dependencies ──────────────────────────────────────────────────
	if (wantsInstall) {
		s.start(`Installing dependencies with ${packageManager}...`);
		await installDependencies(packageManager, targetDir);
		s.stop('Dependencies installed.');
	}

	outro(`Done! To get started:\n\n  cd ${projectName}\n${wantsInstall ? '' : `  ${packageManager} install\n`}  ${packageManager} run dev`);
}

main().catch((error: unknown) => {
	cancel(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
