import { container } from '@wolfstar/http-framework';
import {
	ComponentType,
	MessageFlags,
	type APIActionRowComponent,
	type APIComponentInMessageActionRow,
	type APIMessageTopLevelComponent
} from 'discord-api-types/v10';
import type { ComponentInteraction } from './interactions.js';

/**
 * Every component of a message, with `disabled: true`. Action rows are kept, with their children disabled except
 * link/premium buttons (which have no `custom_id` and cannot be disabled). Every other top-level component
 * (containers, text displays, …) is dropped, since only action rows can be disabled.
 */
export function disableMessageComponents(
	components: readonly APIMessageTopLevelComponent[] | undefined
): APIActionRowComponent<APIComponentInMessageActionRow>[] {
	if (!components) return [];

	const rows: APIActionRowComponent<APIComponentInMessageActionRow>[] = [];
	for (const component of components) {
		if (component.type !== ComponentType.ActionRow) continue;
		rows.push({
			...component,
			components: component.components.map((child) => ('custom_id' in child ? { ...child, disabled: true } : child))
		});
	}

	return rows;
}

/**
 * `update`s the clicked message with its controls disabled, then sends `content` as an ephemeral followup. This is
 * the interaction's single response: `update` first, `followup` second. Followup failures are logged, never thrown.
 */
export async function expireInteraction(interaction: ComponentInteraction, content: string): Promise<void> {
	await interaction.update({ components: disableMessageComponents(interaction.message.components) });

	try {
		const result = await interaction.followup({ content, flags: MessageFlags.Ephemeral });
		if (result.isErr()) {
			container.logger.error('[http-framework-utilities] Failed to send an expiry notice', result.unwrapErr());
		}
	} catch (error) {
		container.logger.error('[http-framework-utilities] Failed to send an expiry notice', error);
	}
}
