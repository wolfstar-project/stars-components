import { PermissionFlagsBits } from 'discord-api-types/v10';

/**
 * The name of a Discord permission flag, as defined by {@linkcode PermissionFlagsBits}.
 */
export type PermissionString = keyof typeof PermissionFlagsBits;

/**
 * Anything that can be resolved into a permission bitfield:
 *
 * - A `bigint`, such as the values of {@linkcode PermissionFlagsBits}.
 * - A {@linkcode PermissionString}, such as `'BanMembers'`.
 * - An arbitrarily nested (readonly) array of the above.
 */
export type PermissionResolvable = bigint | PermissionString | readonly PermissionResolvable[];

/**
 * Resolves any {@linkcode PermissionResolvable} into a single permission bitfield.
 *
 * @param resolvable The value to resolve.
 * @returns The resolved bitfield.
 * @throws `TypeError` If a string was given that is not a known permission flag.
 * @example
 * ```typescript
 * resolvePermissions(['BanMembers', PermissionFlagsBits.KickMembers]);
 * // 6n
 * ```
 */
export function resolvePermissions(resolvable: PermissionResolvable): bigint {
	if (typeof resolvable === 'bigint') return resolvable;

	if (typeof resolvable === 'string') {
		const bit = PermissionFlagsBits[resolvable] as bigint | undefined;
		if (bit === undefined) throw new TypeError(`Unknown permission flag: ${resolvable}`);
		return bit;
	}

	let bits = 0n;
	for (const entry of resolvable) bits |= resolvePermissions(entry);
	return bits;
}

/**
 * Computes the permissions from `required` that are missing in `granted`.
 *
 * @remarks Members with the `Administrator` permission implicitly have every permission, so this returns `0n` when
 * `granted` contains it.
 * @param granted The bitfield of the permissions that were granted.
 * @param required The bitfield of the permissions that are required.
 * @returns The bitfield of the missing permissions, `0n` if none are missing.
 */
export function getMissingPermissions(granted: bigint, required: bigint): bigint {
	if ((granted & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator) return 0n;
	return required & ~granted;
}

/**
 * Converts a permission bitfield into the list of the flag names it contains.
 *
 * @param bits The bitfield to convert.
 * @returns The names of the permissions contained in the bitfield.
 */
export function toPermissionNames(bits: bigint): PermissionString[] {
	const names: PermissionString[] = [];
	for (const [name, bit] of Object.entries(PermissionFlagsBits) as [PermissionString, bigint][]) {
		if ((bits & bit) === bit) names.push(name);
	}

	return names;
}
