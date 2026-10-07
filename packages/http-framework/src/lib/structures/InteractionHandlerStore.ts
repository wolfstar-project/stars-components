import { container, Store } from '@sapphire/pieces';
import { Result } from '@sapphire/result';
import type { APIMessageComponentInteraction, APIModalSubmitInteraction } from 'discord-api-types/v10';
import type { ServerResponse } from 'node:http';
import { Events, type ClientEventInteractionHandlerContext } from '../ClientEvents.js';
import { HttpCodes } from '../api/HttpCodes.js';
import { isUserError } from '../errors/UserError.js';
import { handleError, makeInteraction } from '../interactions/utils/util.js';
import { ErrorMessages } from '../utils/constants.js';
import { runPreconditions } from '../utils/preconditions.js';
import { InteractionHandler } from './InteractionHandler.js';

export class InteractionHandlerStore extends Store<InteractionHandler, 'interaction-handlers'> {
	public constructor() {
		super(InteractionHandler, { name: 'interaction-handlers' });
	}

	public async runHandler(
		response: ServerResponse,
		interaction: APIMessageComponentInteraction | APIModalSubmitInteraction
	): Promise<ServerResponse> {
		const parsed = container.idParser.run(interaction.data.custom_id);
		if (parsed === null) {
			container.client.emit(Events.InteractionHandlerNameInvalid, interaction, response);
			response.statusCode = HttpCodes.BadRequest;
			return response.end(ErrorMessages.InvalidCustomId);
		}

		const handler = this.get(parsed.name);
		if (!handler) {
			container.client.emit(Events.InteractionHandlerNameUnknown, interaction, response);
			response.statusCode = HttpCodes.NotImplemented;
			return response.end(ErrorMessages.UnknownHandlerName);
		}

		const context = { handler, interaction, response };
		const checked = await Result.fromAsync(async () => {
			const handlerInteraction = makeInteraction(response, interaction);
			const preconditions = await runPreconditions(handler, 'interactionHandler', handlerInteraction);
			if (preconditions.isErr()) throw preconditions.unwrapErr();

			return handlerInteraction;
		});

		if (checked.isErr()) {
			this.#emitFailure(checked.unwrapErr(), context, response);
			container.client.emit(Events.InteractionHandlerFinish, context);
			return response;
		}

		container.client.emit(Events.InteractionHandlerAccepted, context);
		container.client.emit(Events.InteractionHandlerRun, context);
		const result = await Result.fromAsync(() => handler.run(checked.unwrap(), parsed.content));
		result
			.inspect((value) => container.client.emit(Events.InteractionHandlerSuccess, context, value))
			.inspectErr((error) => this.#emitFailure(error, context, response));

		container.client.emit(Events.InteractionHandlerFinish, context);
		return response;
	}

	/**
	 * Emits `interactionHandlerDenied` for a {@link UserError} and `interactionHandlerError` otherwise, then replies as
	 * for any other thrown error.
	 *
	 * @param error - The value that was thrown.
	 * @param context - The context of the run.
	 * @param response - The server response object.
	 */
	#emitFailure(error: unknown, context: ClientEventInteractionHandlerContext, response: ServerResponse): void {
		if (isUserError(error)) container.client.emit(Events.InteractionHandlerDenied, error, context);
		else container.client.emit(Events.InteractionHandlerError, error, context);
		handleError(response, error);
	}
}
