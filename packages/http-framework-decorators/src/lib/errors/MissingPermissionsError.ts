import { toPermissionNames, type PermissionString } from '../utils/permissions.js';
import { Identifiers, type Identifier } from './Identifiers.js';

/**
 * Whose permissions were found lacking.
 */
export type MissingPermissionsTarget = 'client' | 'user';

/**
 * The error thrown by {@linkcode RequiresClientPermissions} and {@linkcode RequiresUserPermissions} when the required
 * permissions are not met and no custom fallback was given.
 *
 * @remarks Errors thrown from a command's `chatInputRun` are emitted by the client as `commandError`, so a `Listener`
 * for that event is the idiomatic place to turn this into a user-facing reply.
 */
export class MissingPermissionsError extends Error {
	/**
	 * The identifier of the error, useful to branch on it in an error listener.
	 */
	public readonly identifier: Identifier;

	/**
	 * Whose permissions were found lacking.
	 */
	public readonly target: MissingPermissionsTarget;

	/**
	 * The bitfield of the missing permissions.
	 */
	public readonly missing: bigint;

	/**
	 * The names of the missing permissions.
	 */
	public readonly missingNames: readonly PermissionString[];

	public constructor(target: MissingPermissionsTarget, missing: bigint) {
		const missingNames = toPermissionNames(missing);
		super(
			target === 'client'
				? `Sorry, but I am not allowed to do that. I am missing the permissions: ${missingNames.join(', ')}`
				: `Sorry, but you are not allowed to do that. You are missing the permissions: ${missingNames.join(', ')}`
		);

		this.name = 'MissingPermissionsError';
		this.identifier =
			target === 'client' ? Identifiers.RequiresClientPermissionsMissingPermissions : Identifiers.RequiresUserPermissionsMissingPermissions;
		this.target = target;
		this.missing = missing;
		this.missingNames = missingNames;
	}
}
