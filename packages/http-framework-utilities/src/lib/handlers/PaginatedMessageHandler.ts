import { InteractionHandler } from '@wolfstar/http-framework';
import { handlePaginatedMessageInteraction } from '../PaginatedMessage/handle.js';

export class PaginatedMessageHandler extends InteractionHandler {
	public run(interaction: InteractionHandler.Interaction, customIdValue: unknown) {
		return handlePaginatedMessageInteraction(interaction, customIdValue);
	}
}
