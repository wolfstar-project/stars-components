import { cancel, confirm, intro, isCancel, outro, spinner, text } from '@clack/prompts';
import { join, resolve } from 'node:path';
import { directoryExists } from './tools/fileSystem.js';
import { fetchDependencyVersions } from './tools/npmHelpers.js';
import { detectPackageManager, installDependencies } from './tools/packageManager.js';
import { processTemplate } from './tools/templateProcessor.js';

const NAME_PATTERN = /^[a-z0-9_-]+$/;

async function main(): Promise<void> {
	intro('Welcome to the WolfStar HTTP Framework!');

	const packageManager = detectPackageManager();

	const projectNameArg = process.argv[2];

	const projectName = await text({
		message: 'What is the name of your project?',
		placeholder: 'my-discord-bot',
		initialValue: projectNameArg ?? '',
		validate(value) {
			if (!value) return 'Project name cannot be empty.';
			if (!NAME_PATTERN.test(value)) return 'Use only lowercase letters, numbers, dashes, and underscores.';
			if (directoryExists(resolve(value))) return `Directory "${value}" already exists.`;
			return undefined;
		}
	});
	if (isCancel(projectName)) {
		cancel('Operation cancelled.');
		process.exit(0);
	}

	const portInput = await text({
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
	if (isCancel(portInput)) {
		cancel('Operation cancelled.');
		process.exit(0);
	}

	const wantsI18n = await confirm({
		message: 'Would you like to add i18n support? (@wolfstar/http-framework-i18n)',
		initialValue: false
	});
	if (isCancel(wantsI18n)) {
		cancel('Operation cancelled.');
		process.exit(0);
	}

	const wantsInstall = await confirm({
		message: `Would you like to automatically install dependencies with ${packageManager}?`,
		initialValue: true
	});
	if (isCancel(wantsInstall)) {
		cancel('Operation cancelled.');
		process.exit(0);
	}

	const s = spinner();

	s.start('Fetching latest dependency versions...');
	const versions = fetchDependencyVersions();
	s.stop('Versions fetched.');

	s.start('Generating project files...');
	const outputDir = join(process.cwd(), projectName);
	processTemplate(outputDir, {
		name: projectName,
		port: Number(portInput),
		i18n: Boolean(wantsI18n),
		packageManager,
		todaysDate: new Date().toISOString().split('T')[0]!,
		versions
	});
	s.stop('Project files generated.');

	if (wantsInstall) {
		s.start(`Installing dependencies with ${packageManager}...`);
		installDependencies(outputDir, packageManager);
		s.stop('Dependencies installed.');
	}

	outro(`Done! To get started:\n\n  cd ${projectName}\n${wantsInstall ? '' : `  ${packageManager} install\n`}  ${packageManager} run dev`);
}

main().catch((error: unknown) => {
	cancel(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
