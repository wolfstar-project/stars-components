import type { CommandData, CommandSnapshot } from '../dev/bridge.js';

export type CommandChangeKind = 'added' | 'removed' | 'changed';

export interface CommandChange {
	kind: CommandChangeKind;
	name: string;
	/** Discord's command type: `1` chat input, `2` user, `3` message. */
	type: number;
	/** `null` for a global command, the guild id otherwise. */
	guild: string | null;
}

const typeOf = (command: CommandData) => command.type ?? 1;
const keyOf = (command: CommandData) => `${typeOf(command)}:${command.name}`;

/** `JSON.stringify` with sorted keys, so two bodies built in a different order compare equal. */
export function stableStringify(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
	if (value !== null && typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, item]) => item !== undefined)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
		return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
	}

	return JSON.stringify(value) ?? 'null';
}

/**
 * Whether what Discord has deployed matches what the project defines. Discord answers with fields the project never
 * sent (ids, `version`, defaults such as `nsfw: false` or `options: []`), so only the keys the definition sets are
 * compared, and a missing value equals an empty one. This reads a command as changed when the project changed it, not
 * when Discord filled something in.
 */
export function matchesDeployed(local: unknown, deployed: unknown): boolean {
	if (isEmpty(local)) return isEmpty(deployed);
	if (Array.isArray(local)) {
		return Array.isArray(deployed) && local.length === deployed.length && local.every((item, index) => matchesDeployed(item, deployed[index]));
	}

	if (typeof local === 'object' && local !== null) {
		if (typeof deployed !== 'object' || deployed === null || Array.isArray(deployed)) return false;
		return Object.entries(local).every(([key, value]) => matchesDeployed(value, (deployed as Record<string, unknown>)[key]));
	}

	// `default_member_permissions` is sent as a string or a number and comes back as a string.
	return local === deployed || String(local) === String(deployed);
}

function isEmpty(value: unknown): boolean {
	if (value === undefined || value === null || value === false) return true;
	if (Array.isArray(value)) return value.length === 0;
	return typeof value === 'object' && Object.keys(value).length === 0;
}

/**
 * The difference between two lists of commands of one scope. `same` decides whether a command present in both is
 * unchanged: exact for two snapshots of the bot, {@link matchesDeployed} against what Discord answers.
 */
export function diffCommands(
	previous: readonly CommandData[],
	next: readonly CommandData[],
	guild: string | null,
	same: (previous: CommandData, next: CommandData) => boolean = (a, b) => stableStringify(a) === stableStringify(b)
): CommandChange[] {
	const before = new Map(previous.map((command) => [keyOf(command), command]));
	const after = new Map(next.map((command) => [keyOf(command), command]));
	const changes: CommandChange[] = [];

	for (const [key, command] of after) {
		const old = before.get(key);
		if (old === undefined) changes.push({ kind: 'added', name: command.name, type: typeOf(command), guild });
		else if (!same(old, command)) changes.push({ kind: 'changed', name: command.name, type: typeOf(command), guild });
	}

	for (const [key, command] of before) {
		if (!after.has(key)) changes.push({ kind: 'removed', name: command.name, type: typeOf(command), guild });
	}

	return changes;
}

/** What changed between two snapshots of the commands the bot registers, across the global scope and every guild. */
export function diffSnapshots(previous: CommandSnapshot, next: CommandSnapshot): CommandChange[] {
	const guilds = new Set([...Object.keys(previous.guilds), ...Object.keys(next.guilds)]);
	return [
		...diffCommands(previous.global, next.global, null),
		...[...guilds].sort().flatMap((guild) => diffCommands(previous.guilds[guild] ?? [], next.guilds[guild] ?? [], guild))
	];
}

const KIND_NAMES: Record<number, string> = { 2: 'user', 3: 'message' };

/** `ping`, `Report (message)`, `ping @ 1234` for a guild command. */
export function describeCommand(change: Pick<CommandChange, 'name' | 'type' | 'guild'>): string {
	const kind = KIND_NAMES[change.type];
	return `${change.name}${kind ? ` (${kind})` : ''}${change.guild ? ` @ ${change.guild}` : ''}`;
}
