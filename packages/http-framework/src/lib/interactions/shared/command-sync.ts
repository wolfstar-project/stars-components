import type { ApplicationCommandRegistryEntry } from './ApplicationCommandRegistryEntry.js';

/** Discord defaults for fields whose omission resets their previous value. */
const DEFAULTS: Record<string, unknown> = {
	name_localizations: null,
	description_localizations: null,
	options: [],
	default_member_permissions: null,
	nsfw: false
};

/** Build a complete edit body, including resets for removed optional fields. */
export function commandSyncBody(command: ApplicationCommandRegistryEntry.Command, guildId: string | null) {
	const body: Record<string, unknown> = {
		...DEFAULTS,
		...Object.fromEntries(Object.entries(command).filter(([, value]) => value !== undefined)),
		type: command.type ?? 1
	};
	if ((command.type ?? 1) !== 1) delete body.options;
	if (guildId === null) {
		if (body.contexts === undefined) body.dm_permission ??= true;
	} else {
		delete body.dm_permission;
		delete body.contexts;
		delete body.integration_types;
	}
	return body;
}

/** Compare editable fields, ignoring response metadata and app-dependent defaults. */
export function matchesCommand(local: Record<string, unknown>, deployed: Record<string, unknown>): boolean {
	return Object.entries(local).every(([key, value]) => {
		if (value === undefined) return true;
		let remote = deployed[key];
		if (key === 'default_member_permissions') {
			return value == null ? remote == null : String(value) === String(remote);
		}
		if (key === 'dm_permission') remote ??= true;
		if (key === 'nsfw') remote ??= false;
		if (key === 'options') remote ??= [];
		if (key.endsWith('_localizations')) remote ??= null;
		return equal(value, remote, key);
	});
}

function equal(local: unknown, remote: unknown, key = ''): boolean {
	if (key.endsWith('_localizations')) {
		if (local && typeof local === 'object' && Object.keys(local).length === 0) local = null;
		if (remote && typeof remote === 'object' && Object.keys(remote).length === 0) remote = null;
	}
	if (Array.isArray(local)) {
		if (!Array.isArray(remote)) return false;
		// These fields are sets; options and choices retain their meaningful order.
		if (['contexts', 'integration_types', 'channel_types'].includes(key)) {
			const localValues = new Set(local);
			const remoteValues = new Set(remote);
			return localValues.size === remoteValues.size && [...localValues].every((value) => remoteValues.has(value));
		}
		return local.length === remote.length && local.every((value, index) => equal(value, remote[index]));
	}
	if (local !== null && typeof local === 'object') {
		if (remote === null || typeof remote !== 'object' || Array.isArray(remote)) return false;
		const before = local as Record<string, unknown>;
		const after = remote as Record<string, unknown>;
		return [...new Set([...Object.keys(before), ...Object.keys(after)])].every((field) => {
			const fallback = field.endsWith('_localizations')
				? null
				: ['required', 'autocomplete'].includes(field)
					? false
					: ['options', 'choices', 'channel_types'].includes(field)
						? []
						: undefined;
			return equal(before[field] ?? fallback, after[field] ?? fallback, field);
		});
	}
	return local === remote;
}
