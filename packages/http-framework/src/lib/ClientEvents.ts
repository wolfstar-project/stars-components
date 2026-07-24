import type {
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandInteraction,
	APIMessageComponentInteraction,
	APIModalSubmitInteraction
} from 'discord-api-types/v10';
import type { HttpReply } from './http/HttpReply.js';
import type { Command } from './structures/Command.js';
import type { InteractionHandler } from './structures/InteractionHandler.js';
import type { PluginHook } from './types/Enums.js';

export interface ClientEventCommandContext {
	command: Command;
	interaction: APIApplicationCommandInteraction;
	response: HttpReply;
}

export interface ClientEventAutocompleteContext {
	command: Command;
	interaction: APIApplicationCommandAutocompleteInteraction;
	response: HttpReply;
}

export interface ClientEventInteractionHandlerContext {
	handler: InteractionHandler;
	interaction: APIMessageComponentInteraction | APIModalSubmitInteraction;
	response: HttpReply;
}

export interface ClientEvents {
	error: [error: unknown];
	/**
	 * Emitted after a plugin hook runs, providing the hook's {@link PluginHook} and the plugin's name
	 * (or `undefined` when the registering plugin did not provide one).
	 *
	 * @remarks
	 * The `PreGenericsInitialization`, `PreInitialization`, and `PostInitialization` hooks run
	 * synchronously inside the `Client` constructor, so their emissions fire before `new Client()`
	 * returns. A listener attached afterwards cannot observe them (not even one added by a subclass,
	 * whose constructor body only runs after `super()` has already executed those hooks), so only the
	 * `PreLoad` (during `Client#load`) and `PostListen` (during `Client#listen`) emissions are
	 * observable. To react to the constructor-phase hooks, use the plugin hooks themselves.
	 */
	pluginLoaded: [hook: PluginHook, name: string | undefined];
	commandNameMissing: [interaction: APIApplicationCommandAutocompleteInteraction, response: HttpReply];
	commandNameUnknown: [interaction: APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction, response: HttpReply];
	commandMethodUnknown: [context: ClientEventCommandContext];
	commandRun: [context: ClientEventCommandContext];
	commandSuccess: [context: ClientEventCommandContext, value: unknown];
	commandError: [error: unknown, context: ClientEventCommandContext];
	commandFinish: [context: ClientEventCommandContext];
	autocompleteRun: [context: ClientEventAutocompleteContext];
	autocompleteSuccess: [context: ClientEventAutocompleteContext, value: unknown];
	autocompleteError: [error: unknown, context: ClientEventAutocompleteContext];
	autocompleteFinish: [context: ClientEventAutocompleteContext];
	interactionHandlerNameInvalid: [interaction: APIMessageComponentInteraction | APIModalSubmitInteraction, response: HttpReply];
	interactionHandlerNameUnknown: [interaction: APIMessageComponentInteraction | APIModalSubmitInteraction, response: HttpReply];
	interactionHandlerRun: [context: ClientEventInteractionHandlerContext];
	interactionHandlerSuccess: [context: ClientEventInteractionHandlerContext, value: unknown];
	interactionHandlerError: [error: unknown, context: ClientEventInteractionHandlerContext];
	interactionHandlerFinish: [context: ClientEventInteractionHandlerContext];
}

export type MappedClientEvents = { [K in keyof ClientEvents]: ClientEvents[K] };
