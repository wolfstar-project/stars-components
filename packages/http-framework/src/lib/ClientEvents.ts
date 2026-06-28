import type {
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandInteraction,
	APIMessageComponentInteraction,
	APIModalSubmitInteraction
} from 'discord-api-types/v10';
import type { ServerResponse } from 'node:http';
import type { Command } from './structures/Command.js';
import type { InteractionHandler } from './structures/InteractionHandler.js';
import type { PluginHook } from './types/Enums.js';

export interface ClientEventCommandContext {
	command: Command;
	interaction: APIApplicationCommandInteraction;
	response: ServerResponse;
}

export interface ClientEventAutocompleteContext {
	command: Command;
	interaction: APIApplicationCommandAutocompleteInteraction;
	response: ServerResponse;
}

export interface ClientEventInteractionHandlerContext {
	handler: InteractionHandler;
	interaction: APIMessageComponentInteraction | APIModalSubmitInteraction;
	response: ServerResponse;
}

export interface ClientEvents {
	error: [error: unknown];
	/**
	 * Emitted after a plugin hook runs, providing the hook's {@link PluginHook} and the plugin's name
	 * (or `undefined` when the registering plugin did not provide one).
	 *
	 * @remarks
	 * The `PreGenericsInitialization`, `PreInitialization`, and `PostInitialization` hooks run inside the
	 * `Client` constructor, so those emissions happen before any listener can be attached to the instance
	 * and are only observable from within a subclass constructor. Listeners attached after `new Client()`
	 * returns will only receive the `PreLoad` (during `Client#load`) and `PostListen` (during
	 * `Client#listen`) emissions.
	 */
	pluginLoaded: [hook: PluginHook, name: string | undefined];
	commandNameMissing: [interaction: APIApplicationCommandAutocompleteInteraction, response: ServerResponse];
	commandNameUnknown: [interaction: APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction, response: ServerResponse];
	commandMethodUnknown: [context: ClientEventCommandContext];
	commandRun: [context: ClientEventCommandContext];
	commandSuccess: [context: ClientEventCommandContext, value: unknown];
	commandError: [error: unknown, context: ClientEventCommandContext];
	commandFinish: [context: ClientEventCommandContext];
	autocompleteRun: [context: ClientEventAutocompleteContext];
	autocompleteSuccess: [context: ClientEventAutocompleteContext, value: unknown];
	autocompleteError: [error: unknown, context: ClientEventAutocompleteContext];
	autocompleteFinish: [context: ClientEventAutocompleteContext];
	interactionHandlerNameInvalid: [interaction: APIMessageComponentInteraction | APIModalSubmitInteraction, response: ServerResponse];
	interactionHandlerNameUnknown: [interaction: APIMessageComponentInteraction | APIModalSubmitInteraction, response: ServerResponse];
	interactionHandlerRun: [context: ClientEventInteractionHandlerContext];
	interactionHandlerSuccess: [context: ClientEventInteractionHandlerContext, value: unknown];
	interactionHandlerError: [error: unknown, context: ClientEventInteractionHandlerContext];
	interactionHandlerFinish: [context: ClientEventInteractionHandlerContext];
}

export type MappedClientEvents = { [K in keyof ClientEvents]: ClientEvents[K] };
