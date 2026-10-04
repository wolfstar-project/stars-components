import { defineCommand, type ArgsDef, type CommandDef } from 'citty';
import { cliDiagnostics } from '../utils/diagnostics.js';

// citty types each command by its own arguments; the tree only needs the erased form.
// oxlint-disable-next-line typescript/no-explicit-any
type AnyCommand = CommandDef<any>;

export interface CompletionFlag {
	name: string;
	description: string;
}

export interface CompletionCommand {
	name: string;
	description: string;
	flags: CompletionFlag[];
	subcommands: CompletionCommand[];
}

export const SHELLS = ['bash', 'zsh', 'fish'] as const;
export type Shell = (typeof SHELLS)[number];

async function resolve<T>(value: T | Promise<T> | (() => T | Promise<T>) | undefined): Promise<T | undefined> {
	return typeof value === 'function' ? (value as () => T | Promise<T>)() : value;
}

/** Walks the commands the CLI registers, so the completions never drift from what `--help` prints. */
export async function describeCommands(commands: Record<string, () => Promise<AnyCommand>>): Promise<CompletionCommand[]> {
	const describe = async (name: string, command: AnyCommand): Promise<CompletionCommand> => {
		const meta = (await resolve(command.meta)) ?? {};
		const args = ((await resolve(command.args)) ?? {}) as ArgsDef;
		const children = ((await resolve(command.subCommands)) ?? {}) as Record<string, AnyCommand | (() => Promise<AnyCommand>)>;
		return {
			name,
			description: meta.description ?? '',
			flags: Object.entries(args)
				.filter(([, arg]) => arg.type !== 'positional')
				.map(([flag, arg]) => ({ name: flag, description: arg.description ?? '' })),
			subcommands: await Promise.all(Object.entries(children).map(async ([child, value]) => describe(child, (await resolve(value))!)))
		};
	};

	return Promise.all(Object.entries(commands).map(async ([name, load]) => describe(name, await load())));
}

const flagsOf = (command: CompletionCommand) => [...command.flags.map((flag) => `--${flag.name}`), '--help'].join(' ');

function bash(commands: readonly CompletionCommand[]): string {
	const cases = commands.map((command) => {
		if (command.subcommands.length === 0) return `\t\t${command.name}) words="${flagsOf(command)}" ;;`;
		const nested = command.subcommands.map((child) => `\t\t\t\t${child.name}) words="${flagsOf(child)}" ;;`).join('\n');
		return [
			`\t\t${command.name})`,
			`\t\t\tcase "\${COMP_WORDS[2]}" in`,
			nested,
			`\t\t\t\t*) words="${command.subcommands.map((child) => child.name).join(' ')} ${flagsOf(command)}" ;;`,
			'\t\t\tesac ;;'
		].join('\n');
	});

	return `# stars completions for bash. Load them with: eval "$(stars completions bash)"
_stars() {
	local cur words
	cur="\${COMP_WORDS[COMP_CWORD]}"
	if [ "$COMP_CWORD" -eq 1 ]; then
		words="${commands.map((command) => command.name).join(' ')} --help --version"
	else
		case "\${COMP_WORDS[1]}" in
${cases.join('\n')}
			*) words="" ;;
		esac
	fi
	COMPREPLY=($(compgen -W "$words" -- "$cur"))
}
complete -o default -F _stars stars
`;
}

const quote = (text: string) => `'${text.replaceAll("'", "'\\''")}'`;
/** A zsh `_describe` entry: the colon separates the value from its description, so one in the text is escaped. */
const described = (name: string, description: string) => quote(`${name}:${description.replaceAll(':', '\\:')}`);

function zsh(commands: readonly CompletionCommand[]): string {
	const flags = (command: CompletionCommand) =>
		[...command.flags.map((flag) => described(`--${flag.name}`, flag.description)), described('--help', 'Show the usage')].join(' ');
	const cases = commands.map((command) => {
		if (command.subcommands.length === 0) return `\t\t${command.name}) items=(${flags(command)}) ;;`;
		const nested = command.subcommands.map((child) => `\t\t\t\t${child.name}) items=(${flags(child)}) ;;`).join('\n');
		const children = command.subcommands.map((child) => described(child.name, child.description)).join(' ');
		return [
			`\t\t${command.name})`,
			'\t\t\tcase "$words[3]" in',
			nested,
			`\t\t\t\t*) items=(${children} ${flags(command)}) ;;`,
			'\t\t\tesac ;;'
		].join('\n');
	});

	return `#compdef stars
# stars completions for zsh. Load them with: eval "$(stars completions zsh)"
_stars() {
	local -a items
	if (( CURRENT == 2 )); then
		items=(${commands.map((command) => described(command.name, command.description)).join(' ')})
	else
		case "$words[2]" in
${cases.join('\n')}
		esac
	fi
	_describe 'stars' items
}
compdef _stars stars
`;
}

function fish(commands: readonly CompletionCommand[]): string {
	const lines = ['# stars completions for fish. Load them with: stars completions fish | source', 'complete -c stars -f'];
	const names = commands.map((command) => command.name).join(' ');
	for (const command of commands) {
		lines.push(`complete -c stars -n "not __fish_seen_subcommand_from ${names}" -a ${command.name} -d ${quote(command.description)}`);
		const children = command.subcommands.map((child) => child.name).join(' ');
		for (const flag of command.flags) {
			lines.push(`complete -c stars -n "__fish_seen_subcommand_from ${command.name}" -l ${flag.name} -d ${quote(flag.description)}`);
		}

		for (const child of command.subcommands) {
			lines.push(
				`complete -c stars -n "__fish_seen_subcommand_from ${command.name}; and not __fish_seen_subcommand_from ${children}" -a ${child.name} -d ${quote(child.description)}`
			);
			for (const flag of child.flags.filter((candidate) => !command.flags.some((own) => own.name === candidate.name))) {
				lines.push(
					`complete -c stars -n "__fish_seen_subcommand_from ${command.name}; and __fish_seen_subcommand_from ${child.name}" -l ${flag.name} -d ${quote(flag.description)}`
				);
			}
		}
	}

	return `${lines.join('\n')}\n`;
}

const GENERATORS: Record<Shell, (commands: readonly CompletionCommand[]) => string> = { bash, zsh, fish };

/** The completion script of a shell, for the given commands. */
export function generateCompletions(shell: string, commands: readonly CompletionCommand[]): string {
	if (!(SHELLS as readonly string[]).includes(shell)) throw cliDiagnostics.UNKNOWN_SHELL({ shell });
	return GENERATORS[shell as Shell](commands);
}

export interface CompletionsOptions {
	shell: string;
	stdout?: NodeJS.WritableStream;
}

export async function runCompletions(options: CompletionsOptions): Promise<void> {
	// Imported here: the registry imports this module, as it does every command.
	const { commands } = await import('./index.js');
	(options.stdout ?? process.stdout).write(generateCompletions(options.shell, await describeCommands(commands)));
}

export default defineCommand({
	meta: {
		name: 'completions',
		description: 'Print the shell completion script for bash, zsh or fish'
	},
	args: {
		shell: {
			type: 'positional',
			description: `The shell to print completions for: ${SHELLS.join(', ')}`,
			required: true
		}
	},
	async run({ args }) {
		await runCompletions({ shell: args.shell });
	}
});
