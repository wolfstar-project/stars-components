import { container } from '@sapphire/pieces';
import {
	ApplicationCommandAutocompleteInteractionData,
	ChatInputApplicationCommandInteractionData,
	MessageApplicationCommandInteractionData,
	MessageComponentButtonInteractionData,
	TestableClient,
	UserApplicationCommandInteractionData,
	makeResponse
} from '@wolfstar/http-framework-test-utils';
import {
	ArgumentError,
	CommandStore,
	Identifiers,
	InteractionHandlerStore,
	PreconditionError,
	UserError,
	type ClientEvents,
	type Command,
	type InteractionHandler
} from '../../../src/index.js';

const DENIED_EVENTS = ['chatInputCommandDenied', 'contextMenuCommandDenied', 'autocompleteDenied', 'interactionHandlerDenied'] as const;
const ERROR_EVENTS = ['commandError', 'autocompleteError', 'interactionHandlerError', 'error'] as const;

function listen(client: TestableClient, events: readonly (keyof ClientEvents)[]) {
	const spies = Object.fromEntries(events.map((event) => [event, vi.fn()])) as Record<keyof ClientEvents, ReturnType<typeof vi.fn>>;
	for (const event of events) client.on(event, spies[event] as never);
	return spies;
}

function failing(error: unknown) {
	return () => {
		throw error;
	};
}

function makeCommandStore(run: () => unknown) {
	const store = new CommandStore();
	const command = {
		name: 'foo',
		router: { routeChatInputInteraction: () => 'run', routeContextMenuInteraction: () => 'run' },
		run,
		autocompleteRun: run
	} as unknown as Command;
	vi.spyOn(store.router, 'get').mockReturnValue(command);
	vi.spyOn(store.router, 'getChatInput').mockReturnValue(command);
	return { store, command };
}

function makeHandlerStore(run: () => unknown) {
	const store = new InteractionHandlerStore();
	const handler = { name: 'button', run } as unknown as InteractionHandler;
	vi.spyOn(store, 'get').mockReturnValue(handler);
	return { store, handler };
}

describe('Denied events', () => {
	let client: TestableClient;

	beforeEach(() => {
		client = new TestableClient();
		container.client = client;
		// `handleError` emits `error`, which throws on an emitter nobody listens to.
		client.on('error', () => {});
	});

	describe.each([
		['UserError', () => new UserError({ identifier: Identifiers.ArgumentMissing, message: 'Missing' })],
		['PreconditionError', () => new PreconditionError({ precondition: 'GuildIds' })],
		['ArgumentError', () => new ArgumentError({ argument: 'amount', parameter: 0 })]
	])('GIVEN a %s', (_name, makeError) => {
		test('WHEN a chat input command throws it THEN it emits chatInputCommandDenied only', async () => {
			const error = makeError();
			const { store, command } = makeCommandStore(failing(error));
			const spies = listen(client, [...DENIED_EVENTS, 'commandError']);
			const response = makeResponse();

			await store.runApplicationCommand(response, ChatInputApplicationCommandInteractionData);

			expect(spies.chatInputCommandDenied).toHaveBeenCalledExactlyOnceWith(error, {
				command,
				interaction: ChatInputApplicationCommandInteractionData,
				response
			});
			expect(spies.contextMenuCommandDenied).not.toHaveBeenCalled();
			expect(spies.commandError).not.toHaveBeenCalled();
		});

		test.each([
			['user', UserApplicationCommandInteractionData],
			['message', MessageApplicationCommandInteractionData]
		])('WHEN a %s context menu command throws it THEN it emits contextMenuCommandDenied only', async (_type, interaction) => {
			const error = makeError();
			const { store } = makeCommandStore(failing(error));
			const spies = listen(client, [...DENIED_EVENTS, 'commandError']);

			await store.runApplicationCommand(makeResponse(), interaction);

			expect(spies.contextMenuCommandDenied).toHaveBeenCalledExactlyOnceWith(error, expect.objectContaining({ interaction }));
			expect(spies.chatInputCommandDenied).not.toHaveBeenCalled();
			expect(spies.commandError).not.toHaveBeenCalled();
		});

		test('WHEN an autocomplete handler throws it THEN it emits autocompleteDenied only', async () => {
			const error = makeError();
			const { store } = makeCommandStore(failing(error));
			const spies = listen(client, [...DENIED_EVENTS, 'autocompleteError']);

			await store.runApplicationCommandAutocomplete(makeResponse(), ApplicationCommandAutocompleteInteractionData);

			expect(spies.autocompleteDenied).toHaveBeenCalledExactlyOnceWith(error, expect.anything());
			expect(spies.autocompleteError).not.toHaveBeenCalled();
		});

		test('WHEN an interaction handler throws it THEN it emits interactionHandlerDenied only', async () => {
			const error = makeError();
			const { store, handler } = makeHandlerStore(failing(error));
			const spies = listen(client, [...DENIED_EVENTS, 'interactionHandlerError']);

			await store.runHandler(makeResponse(), MessageComponentButtonInteractionData);

			expect(spies.interactionHandlerDenied).toHaveBeenCalledExactlyOnceWith(error, expect.objectContaining({ handler }));
			expect(spies.interactionHandlerError).not.toHaveBeenCalled();
		});
	});

	describe('GIVEN a generic Error', () => {
		test('WHEN a command throws it THEN it emits commandError and no Denied event', async () => {
			const error = new Error('boom');
			const { store } = makeCommandStore(failing(error));
			const spies = listen(client, [...DENIED_EVENTS, 'commandError']);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);
			await store.runApplicationCommand(makeResponse(), UserApplicationCommandInteractionData);

			expect(spies.commandError).toHaveBeenCalledTimes(2);
			expect(spies.commandError).toHaveBeenCalledWith(error, expect.anything());
			for (const event of DENIED_EVENTS) expect(spies[event]).not.toHaveBeenCalled();
		});

		test('WHEN an autocomplete handler throws it THEN it emits autocompleteError and no Denied event', async () => {
			const error = new Error('boom');
			const { store } = makeCommandStore(failing(error));
			const spies = listen(client, [...DENIED_EVENTS, 'autocompleteError']);

			await store.runApplicationCommandAutocomplete(makeResponse(), ApplicationCommandAutocompleteInteractionData);

			expect(spies.autocompleteError).toHaveBeenCalledExactlyOnceWith(error, expect.anything());
			for (const event of DENIED_EVENTS) expect(spies[event]).not.toHaveBeenCalled();
		});

		test('WHEN an interaction handler throws it THEN it emits interactionHandlerError and no Denied event', async () => {
			const error = new Error('boom');
			const { store } = makeHandlerStore(failing(error));
			const spies = listen(client, [...DENIED_EVENTS, 'interactionHandlerError']);

			await store.runHandler(makeResponse(), MessageComponentButtonInteractionData);

			expect(spies.interactionHandlerError).toHaveBeenCalledExactlyOnceWith(error, expect.anything());
			for (const event of DENIED_EVENTS) expect(spies[event]).not.toHaveBeenCalled();
		});
	});

	test('GIVEN a UserError WHEN a command throws it THEN the error event and the HTTP response are unchanged', async () => {
		const error = new UserError({ identifier: Identifiers.ArgumentMissing });
		const { store } = makeCommandStore(failing(error));
		const spies = listen(client, ['error']);
		const response = makeResponse();

		await store.runApplicationCommand(response, ChatInputApplicationCommandInteractionData);

		expect(spies.error).toHaveBeenCalledExactlyOnceWith(error);
		expect(response.statusCode).toBe(500);
	});

	test('GIVEN a command that succeeds THEN no error or Denied event is emitted', async () => {
		const { store } = makeCommandStore(() => 'ok');
		const spies = listen(client, [...DENIED_EVENTS, ...ERROR_EVENTS, 'commandSuccess']);

		await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

		expect(spies.commandSuccess).toHaveBeenCalledOnce();
		for (const event of [...DENIED_EVENTS, ...ERROR_EVENTS]) expect(spies[event]).not.toHaveBeenCalled();
	});
});
