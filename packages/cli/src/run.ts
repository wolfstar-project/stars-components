import { renderUsage, runCommand as _runCommand, type CommandDef } from 'citty';
import process from 'node:process';
import { commands } from './commands/index.js';
import { main } from './main.js';
import { exitCodeOf, formatError } from './utils/errors.js';
import { readOwnPackageJson } from './utils/version.js';

// citty types each command by its own arguments; the registry needs the erased form.
// oxlint-disable-next-line typescript/no-explicit-any
type AnyCommand = CommandDef<any>;

/**
 * Walks the command names of `stars <command> [<subcommand>] --help` so nested commands (`stars commands clean`)
 * render their own usage instead of their parent's.
 */
async function resolveHelpTarget(names: string[]): Promise<AnyCommand | null> {
	const [first, ...rest] = names;
	if (!first || !Object.hasOwn(commands, first)) return null;

	let command = await commands[first]!();
	for (const name of rest) {
		const resolved = typeof command.subCommands === 'function' ? await command.subCommands() : await command.subCommands;
		const child: unknown = (resolved as Record<string, unknown> | undefined)?.[name];
		if (!child) break;
		command = (typeof child === 'function' ? await child() : child) as AnyCommand;
	}

	return command;
}

export async function runMain(argv: string[] = process.argv.slice(2)): Promise<void> {
	if (argv.includes('--version') || argv.includes('-V')) {
		console.log(readOwnPackageJson().version);
		process.exit(0);
	}

	if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
		// citty's showUsage logs through consola, which is muted in some environments; render and print directly.
		const command = await resolveHelpTarget(argv.filter((argument) => !argument.startsWith('-')));
		console.log(await (command ? renderUsage(command, main) : renderUsage(main)));
		process.exit(0);
	}

	try {
		await _runCommand(main, { rawArgs: argv });
	} catch (error) {
		console.error(await formatError(error));
		process.exit(exitCodeOf(error));
	}
}
