#!/usr/bin/env node

import { defineCommand, renderUsage, runCommand, type CommandDef } from 'citty';
import { exitCodeOf, formatError } from './lib/errors.js';
import { readOwnPackageJson } from './lib/version.js';

const packageJson = readOwnPackageJson();

// citty types each command by its own arguments; the registry needs the erased form.
// oxlint-disable-next-line typescript/no-explicit-any
type AnyCommand = CommandDef<any>;

const subCommands: Record<string, () => Promise<AnyCommand>> = {
	dev: () => import('./commands/dev.js').then((module) => module.default),
	build: () => import('./commands/build.js').then((module) => module.default),
	info: () => import('./commands/info.js').then((module) => module.default),
	codegen: () => import('./commands/codegen.js').then((module) => module.default),
	prepare: () => import('./commands/prepare.js').then((module) => module.default)
};

const main = defineCommand({
	meta: {
		name: 'stars',
		version: packageJson.version,
		description: packageJson.description
	},
	subCommands
});

const rawArgs = process.argv.slice(2);

if (rawArgs.includes('--version') || rawArgs.includes('-V')) {
	console.log(packageJson.version);
	process.exit(0);
}

if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
	const name = rawArgs.find((argument) => !argument.startsWith('-'));
	const subCommand = name && Object.hasOwn(subCommands, name) ? await subCommands[name]() : null;
	// citty's showUsage logs through consola, which is muted in some environments; render and print directly.
	console.log(await (subCommand ? renderUsage(subCommand, main) : renderUsage(main)));
	process.exit(0);
}

try {
	await runCommand(main, { rawArgs });
} catch (error) {
	console.error(formatError(error));
	process.exit(exitCodeOf(error));
}
