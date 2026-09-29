import type { InteractionHandler } from '@wolfstar/http-framework';
import { MessageFlags } from 'discord-api-types/v10';
import { cancelCleanup } from '../cleanup.js';
import { decodeCustomIdContent } from '../custom-id.js';
import { expireInteraction } from '../expire.js';
import { getDefaultExpiredReply, isComponentInteraction } from '../interactions.js';
import { getPromptWaiters } from './waiters.js';

/**
 * Handles a click on a prompt button (`wolfstar-mp.<sessionId>.<answer>`).
 */
export async function handleMessagePrompterInteraction(interaction: InteractionHandler.Interaction, customIdValue: unknown): Promise<void> {
	if (!isComponentInteraction(interaction)) return;

	const decoded = decodeCustomIdContent(customIdValue);
	if (decoded === null) return expireInteraction(interaction, getDefaultExpiredReply());

	const waiter = getPromptWaiters().get(decoded.sessionId);
	if (waiter === undefined) return expireInteraction(interaction, getDefaultExpiredReply());

	if (interaction.user.id !== waiter.ownerId) {
		await interaction.reply({ content: waiter.wrongUserReply, flags: MessageFlags.Ephemeral });
		return;
	}

	await interaction.update({ components: [] });
	waiter.resolve(decoded.action);
	cancelCleanup(decoded.sessionId);
}
