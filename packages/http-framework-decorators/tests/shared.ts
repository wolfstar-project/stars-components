import type { BaseInteraction } from '@wolfstar/http-framework';

export interface MakeInteractionOptions {
	guildId?: string | undefined;
	memberPermissions?: bigint | undefined;
	applicationPermissions?: bigint | undefined;
}

/**
 * Builds the smallest object the decorators of this package read from an interaction.
 */
export function makeInteraction({ guildId, memberPermissions, applicationPermissions }: MakeInteractionOptions = {}): BaseInteraction {
	return {
		guildId,
		applicationPermissions,
		member: guildId === undefined ? undefined : { permissions: String(memberPermissions ?? 0n) },
		inGuild: () => guildId !== undefined
	} as unknown as BaseInteraction;
}
