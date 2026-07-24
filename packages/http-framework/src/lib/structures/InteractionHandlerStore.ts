import { container, Store } from '@sapphire/pieces';
import { Result } from '@sapphire/result';
import type { APIMessageComponentInteraction, APIModalSubmitInteraction } from 'discord-api-types/v10';
import { HttpCodes } from '../api/HttpCodes.js';
import type { HttpReply } from '../http/HttpReply.js';
import { handleError, makeInteraction } from '../interactions/utils/util.js';
import { ErrorMessages } from '../utils/constants.js';
import { InteractionHandler } from './InteractionHandler.js';

export class InteractionHandlerStore extends Store<InteractionHandler, 'interaction-handlers'> {
	public constructor() {
		super(InteractionHandler, { name: 'interaction-handlers' });
	}

	public async runHandler(response: HttpReply, interaction: APIMessageComponentInteraction | APIModalSubmitInteraction): Promise<HttpReply> {
		const parsed = container.idParser.run(interaction.data.custom_id);
		if (parsed === null) {
			container.client.emit('interactionHandlerNameInvalid', interaction, response);
			return response.status(HttpCodes.BadRequest).end(ErrorMessages.InvalidCustomId);
		}

		const handler = this.get(parsed.name);
		if (!handler) {
			container.client.emit('interactionHandlerNameUnknown', interaction, response);
			return response.status(HttpCodes.NotImplemented).end(ErrorMessages.UnknownHandlerName);
		}

		const context = { handler, interaction, response };
		container.client.emit('interactionHandlerRun', context);
		const result = await Result.fromAsync(() => handler.run(makeInteraction(response, interaction), parsed.content));
		result
			.inspect((value) => container.client.emit('interactionHandlerSuccess', context, value))
			.inspectErr((error) => (container.client.emit('interactionHandlerError', error, context), handleError(response, error)));

		container.client.emit('interactionHandlerFinish', context);
		return response;
	}
}
