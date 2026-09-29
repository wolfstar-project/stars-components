import { InteractionHandler } from '@wolfstar/http-framework';
import { handleMessagePrompterInteraction } from '../MessagePrompter/handle.js';

export class MessagePrompterHandler extends InteractionHandler {
	public run(interaction: InteractionHandler.Interaction, customIdValue: unknown) {
		return handleMessagePrompterInteraction(interaction, customIdValue);
	}
}
