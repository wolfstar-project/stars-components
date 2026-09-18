import { defineCommand, type CommandDef } from 'citty';
import { commands } from './commands/index.js';
import { readOwnPackageJson } from './utils/version.js';

// citty types each command by its own arguments; the registry needs the erased form.
// oxlint-disable-next-line typescript/no-explicit-any
type AnyCommand = CommandDef<any>;

const packageJson = readOwnPackageJson();

export const main = defineCommand({
	meta: {
		name: 'stars',
		version: packageJson.version,
		description: packageJson.description
	},
	subCommands: commands
}) as AnyCommand;
