import type { ApplicationCommand, ApplicationCommandOption } from './discord.js';

const CHAT_INPUT = 1;
const SUBCOMMAND = 1;
const SUBCOMMAND_GROUP = 2;

/** What `stars commands clean --name` acts on once the names are resolved against the deployed commands. */
export type CleanTarget =
	/** A whole command is deleted. `lastOf` lists the paths that were asked for and left it without a subcommand. */
	| { kind: 'command'; command: ApplicationCommand; lastOf?: string[] }
	/** Subcommands or groups leave `command`, which is sent back with the `options` that remain. */
	| { kind: 'option'; command: ApplicationCommand; paths: string[]; options: ApplicationCommandOption[] };

export interface CleanResolution {
	targets: CleanTarget[];
	/** The names that match no command, subcommand or group. */
	missing: string[];
}

const isChatInput = (command: ApplicationCommand) => (command.type ?? CHAT_INPUT) === CHAT_INPUT;

/**
 * Splits a path such as `settings server` or `settings group sub`. A context menu name may hold spaces, which is why
 * `resolveCleanTargets` tries a name as a whole command first.
 */
export function splitPath(name: string): string[] {
	return name.split(/\s+/).filter((segment) => segment.length > 0);
}

/** The option a path (after the command name) points at, or `undefined` when the command has no such entry. */
function findEntry(command: ApplicationCommand, [first, second]: readonly string[]): ApplicationCommandOption | undefined {
	const entry = command.options?.find((option) => option.name === first && (option.type === SUBCOMMAND || option.type === SUBCOMMAND_GROUP));
	if (!entry || second === undefined) return entry;

	return entry.type === SUBCOMMAND_GROUP ? entry.options?.find((option) => option.name === second && option.type === SUBCOMMAND) : undefined;
}

/** `options` without the entries at `paths`; a group left empty goes too, since Discord rejects one with no subcommand. */
function withoutPaths(options: readonly ApplicationCommandOption[], paths: readonly string[][]): ApplicationCommandOption[] {
	const result: ApplicationCommandOption[] = [];
	for (const option of options) {
		if (paths.some(([first, second]) => second === undefined && first === option.name)) continue;

		const inside = paths.filter(([first, second]) => second !== undefined && first === option.name);
		if (option.type === SUBCOMMAND_GROUP && inside.length > 0) {
			const remaining = withoutPaths(
				option.options ?? [],
				inside.map(([, second]) => [second!])
			);
			if (remaining.length === 0) continue;

			result.push({ ...option, options: remaining });
			continue;
		}

		result.push(option);
	}

	return result;
}

/**
 * Resolves `--name` values against the deployed commands. A value that is the name of a command deletes it, so a
 * context menu named `Report User` keeps working; otherwise it is a path through a chat input command's options:
 * `command sub` or `command group` removes that subcommand or group, `command group sub` one inside a group.
 *
 * Paths under the same command collapse into one target, a path below a command that is deleted anyway is dropped,
 * and a command left without a subcommand becomes a deletion (Discord does not accept one with none).
 */
export function resolveCleanTargets(deployed: readonly ApplicationCommand[], names: readonly string[]): CleanResolution {
	const missing: string[] = [];
	const deleted = new Map<string, ApplicationCommand>();
	const removals = new Map<string, { command: ApplicationCommand; paths: string[][] }>();

	for (const name of names) {
		const whole = deployed.filter((command) => command.name === name);
		if (whole.length > 0) {
			for (const command of whole) deleted.set(command.id, command);
			continue;
		}

		const [commandName, ...path] = splitPath(name);
		const command =
			commandName === undefined || path.length === 0 || path.length > 2
				? undefined
				: deployed.find((item) => isChatInput(item) && item.name === commandName);
		if (!command || !findEntry(command, path)) {
			missing.push(name);
			continue;
		}

		const entry = removals.get(command.id) ?? { command, paths: [] };
		if (!entry.paths.some((known) => known.join(' ') === path.join(' '))) entry.paths.push(path);
		removals.set(command.id, entry);
	}

	const targets: CleanTarget[] = [...deleted.values()].map((command) => ({ kind: 'command', command }));
	for (const { command, paths } of removals.values()) {
		if (deleted.has(command.id)) continue;

		const options = withoutPaths(command.options ?? [], paths);
		const names = paths.map((path) => `${command.name} ${path.join(' ')}`);
		targets.push(options.length === 0 ? { kind: 'command', command, lastOf: names } : { kind: 'option', command, paths: names, options });
	}

	return { targets, missing };
}
