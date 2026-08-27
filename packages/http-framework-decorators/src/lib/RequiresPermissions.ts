import type { BaseInteraction } from '@wolfstar/http-framework';
import { MissingPermissionsError } from './errors/MissingPermissionsError.js';
import { createFunctionPrecondition } from './utils/decorators.js';
import { getMissingPermissions, resolvePermissions, type PermissionResolvable } from './utils/permissions.js';

/**
 * Reads the permissions the invoking user has in the channel the interaction was sent from.
 *
 * @param interaction The interaction to read from.
 * @returns The bitfield of the user's permissions, or `null` when the interaction did not come from a guild and there
 * are therefore no guild permissions to check.
 */
function getUserPermissions(interaction: BaseInteraction): bigint | null {
	const permissions = interaction.member?.permissions;
	return permissions === undefined ? null : BigInt(permissions);
}

/**
 * Decorator that only runs the decorated method when the application has all of the given permissions in the channel
 * the interaction was sent from, as reported by the interaction's `app_permissions` field.
 *
 * @remarks When the fallback is omitted, a {@linkcode MissingPermissionsError} is thrown, which the client emits as
 * `commandError` (or `interactionHandlerError`) for a `Listener` to turn into a user-facing reply.
 * @param permissions The permissions the application must have.
 * @returns A method decorator.
 * @example
 * ```typescript
 * import { Command, RegisterCommand } from '@wolfstar/http-framework';
 * import { RequiresClientPermissions } from '@wolfstar/http-framework-decorators';
 *
 * (at)RegisterCommand({ name: 'purge', description: 'Deletes messages' })
 * export class UserCommand extends Command {
 * 	(at)RequiresClientPermissions('ManageMessages')
 * 	public override chatInputRun(interaction: Command.ChatInputInteraction) {
 * 		return interaction.reply({ content: 'Purging!' });
 * 	}
 * }
 * ```
 */
export function RequiresClientPermissions(...permissions: PermissionResolvable[]): MethodDecorator {
	const required = resolvePermissions(permissions);
	return createFunctionPrecondition(
		(interaction: BaseInteraction) => {
			const granted = interaction.applicationPermissions;
			// `app_permissions` is always sent by Discord, but the field is optional in the typings; when it is absent
			// there is nothing to check against, so the method is allowed to run.
			return granted === undefined || getMissingPermissions(granted, required) === 0n;
		},
		(interaction: BaseInteraction) => {
			throw new MissingPermissionsError('client', getMissingPermissions(interaction.applicationPermissions ?? 0n, required));
		}
	);
}

/**
 * Decorator that only runs the decorated method when the invoking user has all of the given permissions in the channel
 * the interaction was sent from.
 *
 * @remarks Interactions received outside of a guild carry no member permissions, so the check passes for them. Pair
 * this decorator with {@linkcode RequiresGuildContext} when the method must also be guild-only.
 * @remarks When the fallback is omitted, a {@linkcode MissingPermissionsError} is thrown, which the client emits as
 * `commandError` (or `interactionHandlerError`) for a `Listener` to turn into a user-facing reply.
 * @param permissions The permissions the invoking user must have.
 * @returns A method decorator.
 * @example
 * ```typescript
 * import { Command, RegisterCommand } from '@wolfstar/http-framework';
 * import { RequiresUserPermissions } from '@wolfstar/http-framework-decorators';
 *
 * (at)RegisterCommand({ name: 'ban', description: 'Bans a member' })
 * export class UserCommand extends Command {
 * 	(at)RequiresUserPermissions('BanMembers')
 * 	public override chatInputRun(interaction: Command.ChatInputInteraction) {
 * 		return interaction.reply({ content: 'Banned!' });
 * 	}
 * }
 * ```
 */
export function RequiresUserPermissions(...permissions: PermissionResolvable[]): MethodDecorator {
	const required = resolvePermissions(permissions);
	return createFunctionPrecondition(
		(interaction: BaseInteraction) => {
			const granted = getUserPermissions(interaction);
			return granted === null || getMissingPermissions(granted, required) === 0n;
		},
		(interaction: BaseInteraction) => {
			throw new MissingPermissionsError('user', getMissingPermissions(getUserPermissions(interaction) ?? 0n, required));
		}
	);
}
