import type { Piece } from '@sapphire/pieces';
import type {
	APIApplicationCommandAutocompleteInteraction,
	APIApplicationCommandInteraction,
	APIMessageComponentInteraction,
	APIModalSubmitInteraction
} from 'discord-api-types/v10';
import type { ServerResponse } from 'node:http';
import type { UserError } from './errors/UserError.js';
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

/**
 * The name of every event emitted by the {@link Client}, mirroring the keys of {@link ClientEvents}.
 *
 * @remarks
 * Each member's value is the plain event name, so they are interchangeable with the string literals
 * accepted by `Client#on`, `Client#emit`, and {@link Listener.Options.event}.
 *
 * @example
 * ```typescript
 * client.on(Events.CommandError, (error, context) => console.error(context.command.name, error));
 * ```
 *
 * @since 3.4.0
 */
export enum Events {
	Error = 'error',
	PluginLoaded = 'pluginLoaded',
	CommandNameMissing = 'commandNameMissing',
	CommandNameUnknown = 'commandNameUnknown',
	CommandMethodUnknown = 'commandMethodUnknown',
	PreChatInputCommandRun = 'preChatInputCommandRun',
	PreContextMenuCommandRun = 'preContextMenuCommandRun',
	ChatInputCommandAccepted = 'chatInputCommandAccepted',
	ContextMenuCommandAccepted = 'contextMenuCommandAccepted',
	CommandRun = 'commandRun',
	CommandSuccess = 'commandSuccess',
	CommandError = 'commandError',
	ChatInputCommandDenied = 'chatInputCommandDenied',
	ContextMenuCommandDenied = 'contextMenuCommandDenied',
	CommandFinish = 'commandFinish',
	AutocompleteAccepted = 'autocompleteAccepted',
	AutocompleteRun = 'autocompleteRun',
	AutocompleteSuccess = 'autocompleteSuccess',
	AutocompleteError = 'autocompleteError',
	AutocompleteDenied = 'autocompleteDenied',
	AutocompleteFinish = 'autocompleteFinish',
	InteractionHandlerNameInvalid = 'interactionHandlerNameInvalid',
	InteractionHandlerNameUnknown = 'interactionHandlerNameUnknown',
	InteractionHandlerAccepted = 'interactionHandlerAccepted',
	InteractionHandlerRun = 'interactionHandlerRun',
	InteractionHandlerSuccess = 'interactionHandlerSuccess',
	InteractionHandlerError = 'interactionHandlerError',
	InteractionHandlerDenied = 'interactionHandlerDenied',
	InteractionHandlerFinish = 'interactionHandlerFinish',
	HmrStart = 'hmrStart',
	HmrStop = 'hmrStop',
	HmrPiecesLoaded = 'hmrPiecesLoaded',
	HmrPieceReloaded = 'hmrPieceReloaded',
	HmrPieceUnloaded = 'hmrPieceUnloaded',
	HmrError = 'hmrError'
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
	commandNameMissing: [interaction: APIApplicationCommandAutocompleteInteraction, response: ServerResponse];
	commandNameUnknown: [interaction: APIApplicationCommandInteraction | APIApplicationCommandAutocompleteInteraction, response: ServerResponse];
	commandMethodUnknown: [context: ClientEventCommandContext];
	/**
	 * Emitted for a chat input command before its preconditions run, then followed by either
	 * {@link ClientEvents.chatInputCommandDenied} or {@link ClientEvents.chatInputCommandAccepted}.
	 *
	 * @since 6.3.0
	 */
	preChatInputCommandRun: [context: ClientEventCommandContext];
	/**
	 * Emitted for a user or message context menu command before its preconditions run, then followed by either
	 * {@link ClientEvents.contextMenuCommandDenied} or {@link ClientEvents.contextMenuCommandAccepted}.
	 *
	 * @since 6.3.0
	 */
	preContextMenuCommandRun: [context: ClientEventCommandContext];
	/**
	 * Emitted when a chat input command passes every precondition, right before {@link ClientEvents.commandRun}.
	 *
	 * @since 6.3.0
	 */
	chatInputCommandAccepted: [context: ClientEventCommandContext];
	/**
	 * Emitted when a context menu command passes every precondition, right before {@link ClientEvents.commandRun}.
	 *
	 * @since 6.3.0
	 */
	contextMenuCommandAccepted: [context: ClientEventCommandContext];
	/**
	 * Emitted right before the method of a command runs. Since 6.3.0 that is after its preconditions passed, so a
	 * denied command does not emit it.
	 */
	commandRun: [context: ClientEventCommandContext];
	commandSuccess: [context: ClientEventCommandContext, value: unknown];
	/**
	 * Emitted when a command throws something that is not a {@link UserError}. A {@link UserError} is emitted as
	 * {@link ClientEvents.chatInputCommandDenied} or {@link ClientEvents.contextMenuCommandDenied} instead.
	 *
	 * @remarks Since 6.3.0 a thrown {@link UserError} (such as the `PreconditionError` of `@wolfstar/decorators`) no
	 * longer reaches this event.
	 */
	commandError: [error: unknown, context: ClientEventCommandContext];
	/**
	 * Emitted when a chat input command throws a {@link UserError}, an expected failure that is meant to be shown to the
	 * user. The `error` event is still emitted, and the HTTP response is produced as for any other thrown error
	 * (`httpReplyOnError`).
	 *
	 * @since 6.3.0
	 */
	chatInputCommandDenied: [error: UserError, context: ClientEventCommandContext];
	/**
	 * Emitted when a user or message context menu command throws a {@link UserError}. See
	 * {@link ClientEvents.chatInputCommandDenied}.
	 *
	 * @since 6.3.0
	 */
	contextMenuCommandDenied: [error: UserError, context: ClientEventCommandContext];
	commandFinish: [context: ClientEventCommandContext];
	/**
	 * Emitted when an autocomplete interaction passes every precondition, right before
	 * {@link ClientEvents.autocompleteRun}.
	 *
	 * @since 6.3.0
	 */
	autocompleteAccepted: [context: ClientEventAutocompleteContext];
	autocompleteRun: [context: ClientEventAutocompleteContext];
	autocompleteSuccess: [context: ClientEventAutocompleteContext, value: unknown];
	autocompleteError: [error: unknown, context: ClientEventAutocompleteContext];
	/**
	 * Emitted when an autocomplete handler throws a {@link UserError}, instead of {@link ClientEvents.autocompleteError}.
	 *
	 * @since 6.3.0
	 */
	autocompleteDenied: [error: UserError, context: ClientEventAutocompleteContext];
	autocompleteFinish: [context: ClientEventAutocompleteContext];
	interactionHandlerNameInvalid: [interaction: APIMessageComponentInteraction | APIModalSubmitInteraction, response: ServerResponse];
	interactionHandlerNameUnknown: [interaction: APIMessageComponentInteraction | APIModalSubmitInteraction, response: ServerResponse];
	/**
	 * Emitted when an interaction handler passes every precondition, right before
	 * {@link ClientEvents.interactionHandlerRun}.
	 *
	 * @since 6.3.0
	 */
	interactionHandlerAccepted: [context: ClientEventInteractionHandlerContext];
	interactionHandlerRun: [context: ClientEventInteractionHandlerContext];
	interactionHandlerSuccess: [context: ClientEventInteractionHandlerContext, value: unknown];
	interactionHandlerError: [error: unknown, context: ClientEventInteractionHandlerContext];
	/**
	 * Emitted when an interaction handler throws a {@link UserError}, instead of
	 * {@link ClientEvents.interactionHandlerError}.
	 *
	 * @since 6.3.0
	 */
	interactionHandlerDenied: [error: UserError, context: ClientEventInteractionHandlerContext];
	interactionHandlerFinish: [context: ClientEventInteractionHandlerContext];
	/**
	 * Emitted when the Hot Module Reloader starts watching, with the list of watched store paths.
	 *
	 * @since 3.3.0
	 */
	hmrStart: [paths: string[]];
	/**
	 * Emitted when the Hot Module Reloader stops watching and all of its watchers have been closed.
	 *
	 * @since 3.3.0
	 */
	hmrStop: [];
	/**
	 * Emitted when the Hot Module Reloader loads the pieces of a newly created file.
	 *
	 * @since 3.3.0
	 */
	hmrPiecesLoaded: [pieces: Piece[], path: string];
	/**
	 * Emitted when the Hot Module Reloader reloads an already loaded piece after its file changed.
	 *
	 * @since 3.3.0
	 */
	hmrPieceReloaded: [piece: Piece, path: string];
	/**
	 * Emitted when the Hot Module Reloader unloads a piece after its file was deleted.
	 *
	 * @since 3.3.0
	 */
	hmrPieceUnloaded: [piece: Piece, path: string];
	/**
	 * Emitted when the Hot Module Reloader fails to load, reload, or unload the pieces of a file. The error is not
	 * rethrown: saving the file again retries the operation.
	 *
	 * @since 3.3.0
	 */
	hmrError: [error: unknown, path: string];
}

/**
 * The name of any of the events emitted by the {@link Client}, either as a plain string literal or as an
 * {@link Events} member.
 *
 * @since 3.4.0
 */
export type ClientEventName = keyof ClientEvents;

export type MappedClientEvents = { [K in keyof ClientEvents]: ClientEvents[K] };
