import { container, VirtualPath } from '@sapphire/pieces';
import { err, ok } from '@sapphire/result';
import {
	ApplicationCommandAutocompleteInteractionData,
	ChatInputApplicationCommandInteractionData,
	MessageApplicationCommandInteractionData,
	TestableClient,
	UserApplicationCommandInteractionData,
	makeResponse
} from '@wolfstar/http-framework-test-utils';
import {
	CommandStore,
	Identifiers,
	Precondition,
	PreconditionError,
	PreconditionStore,
	UserError,
	type ClientEvents,
	type Command,
	type PreconditionFunction,
	type PreconditionResolvable
} from '../../../src/index.js';

function listen(client: TestableClient, events: readonly (keyof ClientEvents)[]) {
	const spies = Object.fromEntries(events.map((event) => [event, vi.fn()])) as Record<keyof ClientEvents, ReturnType<typeof vi.fn>>;
	for (const event of events) client.on(event, spies[event] as never);
	return spies;
}

function makeStore(preconditions: readonly PreconditionResolvable[] | undefined, run = vi.fn(() => 'ran')) {
	const store = new CommandStore();
	const command = {
		name: 'foo',
		options: { preconditions },
		router: { routeChatInputInteraction: () => 'run', routeContextMenuInteraction: () => 'run' },
		run
	} as unknown as Command;
	vi.spyOn(store.router, 'get').mockReturnValue(command);
	return { store, command, run };
}

const deny =
	(name: string): PreconditionFunction =>
	() =>
		err(new PreconditionError({ precondition: name }));

interface PieceOptions {
	position?: number | null;
	chatInputRun?: Precondition['chatInputRun'];
	contextMenuRun?: Precondition['contextMenuRun'];
}

/** Loads a precondition piece with the given name and handlers into the store of the client. */
function addPiece(name: string, { position = null, chatInputRun, contextMenuRun }: PieceOptions = {}) {
	class TestPrecondition extends Precondition {
		public override readonly chatInputRun = chatInputRun;
		public override readonly contextMenuRun = contextMenuRun;
	}

	const piece = new TestPrecondition(
		{ name, path: VirtualPath, root: VirtualPath, store: container.stores.get('preconditions') },
		{ name, position }
	);
	container.stores.get('preconditions').set(name, piece);
	return piece;
}

describe('Precondition', () => {
	let client: TestableClient;

	beforeEach(() => {
		client = new TestableClient();
		container.client = client;
		container.stores.get('preconditions').clear();
		client.on('error', () => {});
	});

	afterAll(() => container.stores.get('preconditions').clear());

	describe('the piece', () => {
		test('GIVEN the framework THEN it registers the preconditions store', () => {
			expect(container.stores.get('preconditions')).toBeInstanceOf(PreconditionStore);
			expect(container.stores.get('preconditions').name).toBe('preconditions');
		});

		test('GIVEN ok() THEN it is an Ok result', () => {
			const piece = addPiece('Anything');
			expect((piece.ok() as ReturnType<typeof ok>).isOk()).toBe(true);
		});

		test('GIVEN error() THEN it is an Err with a PreconditionError for the piece', () => {
			const piece = addPiece('Owner');
			const result = piece.error({ message: 'Nope', context: { a: 1 } }) as ReturnType<typeof err>;

			expect(result.isErr()).toBe(true);
			const error = result.unwrapErr() as PreconditionError;
			expect(error).toBeInstanceOf(PreconditionError);
			expect(error).toMatchObject({ precondition: 'Owner', identifier: 'Owner', message: 'Nope', context: { a: 1 } });
		});

		test('GIVEN error() with an identifier THEN the identifier overrides the default', () => {
			const piece = addPiece('Owner');
			const error = (piece.error({ identifier: 'custom' }) as ReturnType<typeof err>).unwrapErr() as PreconditionError;

			expect(error.identifier).toBe('custom');
			expect(error.precondition).toBe('Owner');
		});

		test('GIVEN a class loaded with loadPiece THEN it is a global precondition by its position', async () => {
			const chatInputRun = vi.fn(() => ok());
			class Loaded extends Precondition {
				public constructor(context: Precondition.LoaderContext) {
					super(context, { position: 5 });
				}

				public override chatInputRun = chatInputRun;
			}

			// `loadPiece` only queues the piece until the stores load, which `Client#load` does.
			await container.stores.loadPiece({ store: 'preconditions', name: 'Loaded', piece: Loaded as never });
			await container.stores.get('preconditions').loadAll();
			const { store } = makeStore(undefined);
			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(container.stores.get('preconditions').get('Loaded')).toBeInstanceOf(Loaded);
			expect(chatInputRun).toHaveBeenCalledOnce();
		});

		test('GIVEN no position THEN the position is null', () => {
			expect(addPiece('A').position).toBeNull();
			expect(addPiece('B', { position: 10 }).position).toBe(10);
		});
	});

	describe('the command option', () => {
		test('GIVEN no preconditions THEN the command runs', async () => {
			const { store, run } = makeStore(undefined);
			const spies = listen(client, ['commandSuccess', 'chatInputCommandDenied']);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(run).toHaveBeenCalledOnce();
			expect(spies.commandSuccess).toHaveBeenCalledOnce();
			expect(spies.chatInputCommandDenied).not.toHaveBeenCalled();
		});

		test('GIVEN functions that pass THEN they run in order with the interaction and the command, before the command', async () => {
			const calls: string[] = [];
			const first = vi.fn(() => (calls.push('first'), ok()));
			const second = vi.fn(async () => (calls.push('second'), ok()));
			const { store, command, run } = makeStore(
				[first, second],
				vi.fn(() => (calls.push('run'), 'ran'))
			);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(calls).toEqual(['first', 'second', 'run']);
			expect(first).toHaveBeenCalledWith(expect.objectContaining({ id: ChatInputApplicationCommandInteractionData.id }), command);
			expect(run).toHaveBeenCalledOnce();
		});

		test('GIVEN a function that denies a chat input command THEN chatInputCommandDenied is emitted and the command does not run', async () => {
			const later = vi.fn(() => ok());
			const { store, command, run } = makeStore([deny('Owner'), later]);
			const spies = listen(client, ['chatInputCommandDenied', 'contextMenuCommandDenied', 'commandError', 'commandSuccess', 'commandFinish']);
			const response = makeResponse();

			await store.runApplicationCommand(response, ChatInputApplicationCommandInteractionData);

			expect(spies.chatInputCommandDenied).toHaveBeenCalledExactlyOnceWith(expect.any(PreconditionError), {
				command,
				interaction: ChatInputApplicationCommandInteractionData,
				response
			});
			expect(spies.chatInputCommandDenied.mock.calls[0][0]).toMatchObject({ precondition: 'Owner', identifier: 'Owner' });
			expect(run).not.toHaveBeenCalled();
			expect(later).not.toHaveBeenCalled();
			expect(spies.contextMenuCommandDenied).not.toHaveBeenCalled();
			expect(spies.commandError).not.toHaveBeenCalled();
			expect(spies.commandSuccess).not.toHaveBeenCalled();
			expect(spies.commandFinish).toHaveBeenCalledOnce();
		});

		test.each([
			['user', UserApplicationCommandInteractionData],
			['message', MessageApplicationCommandInteractionData]
		])('GIVEN a function that denies a %s context menu command THEN contextMenuCommandDenied is emitted', async (_type, interaction) => {
			const { store, run } = makeStore([deny('Owner')]);
			const spies = listen(client, ['chatInputCommandDenied', 'contextMenuCommandDenied', 'commandError']);

			await store.runApplicationCommand(makeResponse(), interaction);

			expect(spies.contextMenuCommandDenied).toHaveBeenCalledOnce();
			expect(spies.chatInputCommandDenied).not.toHaveBeenCalled();
			expect(spies.commandError).not.toHaveBeenCalled();
			expect(run).not.toHaveBeenCalled();
		});

		test('GIVEN a function that throws a generic Error THEN commandError is emitted and the command does not run', async () => {
			const boom = new Error('boom');
			const { store, run } = makeStore([
				() => {
					throw boom;
				}
			]);
			const spies = listen(client, ['chatInputCommandDenied', 'commandError']);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(spies.commandError).toHaveBeenCalledExactlyOnceWith(boom, expect.anything());
			expect(spies.chatInputCommandDenied).not.toHaveBeenCalled();
			expect(run).not.toHaveBeenCalled();
		});

		test('GIVEN a function that throws a UserError THEN chatInputCommandDenied is emitted', async () => {
			const error = new UserError({ identifier: 'nope' });
			const { store } = makeStore([
				() => {
					throw error;
				}
			]);
			const spies = listen(client, ['chatInputCommandDenied', 'commandError']);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(spies.chatInputCommandDenied).toHaveBeenCalledExactlyOnceWith(error, expect.anything());
			expect(spies.commandError).not.toHaveBeenCalled();
		});

		test('GIVEN a denial THEN the error event and the HTTP response are the same as for a thrown UserError', async () => {
			const { store } = makeStore([deny('Owner')]);
			const spies = listen(client, ['error']);
			const response = makeResponse();

			await store.runApplicationCommand(response, ChatInputApplicationCommandInteractionData);

			expect(spies.error).toHaveBeenCalledOnce();
			expect(response.statusCode).toBe(500);
		});

		test('GIVEN an autocomplete interaction THEN the preconditions are not run', async () => {
			const precondition = vi.fn(deny('Owner'));
			addPiece('Global', { position: 1, chatInputRun: vi.fn(() => err(new PreconditionError({ precondition: 'Global' }))) });
			const { store, command } = makeStore([precondition]);
			(command as unknown as { autocompleteRun: () => void }).autocompleteRun = vi.fn();
			vi.spyOn(store.router, 'getChatInput').mockReturnValue(command);
			const spies = listen(client, ['autocompleteDenied', 'autocompleteError']);

			await store.runApplicationCommandAutocomplete(makeResponse(), ApplicationCommandAutocompleteInteractionData);

			expect(precondition).not.toHaveBeenCalled();
			expect(spies.autocompleteDenied).not.toHaveBeenCalled();
			expect(spies.autocompleteError).not.toHaveBeenCalled();
		});
	});

	describe('named preconditions', () => {
		test('GIVEN a name THEN the piece runs with an empty context', async () => {
			const chatInputRun = vi.fn(() => ok());
			addPiece('Owner', { chatInputRun });
			const { store, command, run } = makeStore(['Owner']);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(chatInputRun).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({ id: ChatInputApplicationCommandInteractionData.id }),
				command,
				{}
			);
			expect(run).toHaveBeenCalledOnce();
		});

		test('GIVEN a name with a context THEN the piece receives it', async () => {
			const chatInputRun = vi.fn(() => ok());
			addPiece('Role', { chatInputRun });
			const { store } = makeStore([{ name: 'Role', context: { roleId: '1' } }]);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(chatInputRun).toHaveBeenCalledWith(expect.anything(), expect.anything(), { roleId: '1' });
		});

		test('GIVEN a piece that denies THEN the PreconditionError carries the name of the piece', async () => {
			const piece = addPiece('Owner', { chatInputRun: () => err(new PreconditionError({ precondition: 'Owner', message: 'Owner only' })) });
			const { store, run } = makeStore(['Owner']);
			const spies = listen(client, ['chatInputCommandDenied']);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(piece.name).toBe('Owner');
			expect(spies.chatInputCommandDenied.mock.calls[0][0]).toMatchObject({ precondition: 'Owner', message: 'Owner only' });
			expect(run).not.toHaveBeenCalled();
		});

		test('GIVEN a context menu command THEN contextMenuRun is used and chatInputRun is not', async () => {
			const chatInputRun = vi.fn(() => ok());
			const contextMenuRun = vi.fn(() => ok());
			addPiece('Both', { chatInputRun, contextMenuRun });
			const { store } = makeStore(['Both']);

			await store.runApplicationCommand(makeResponse(), UserApplicationCommandInteractionData);

			expect(contextMenuRun).toHaveBeenCalledOnce();
			expect(chatInputRun).not.toHaveBeenCalled();
		});

		test.each([
			['chat input', ChatInputApplicationCommandInteractionData, 'chatInputCommandDenied', Identifiers.PreconditionMissingChatInputHandler],
			['context menu', UserApplicationCommandInteractionData, 'contextMenuCommandDenied', Identifiers.PreconditionMissingContextMenuHandler]
		] as const)('GIVEN a piece with no %s handler THEN the command is denied', async (_kind, interaction, event, identifier) => {
			addPiece('NoHandler');
			const { store, run } = makeStore(['NoHandler']);
			const spies = listen(client, [event]);

			await store.runApplicationCommand(makeResponse(), interaction);

			expect(spies[event]).toHaveBeenCalledOnce();
			expect(spies[event].mock.calls[0][0]).toMatchObject({ precondition: 'NoHandler', identifier });
			expect(run).not.toHaveBeenCalled();
		});

		test('GIVEN a name that is not in the store THEN the command is denied as unavailable', async () => {
			const { store, run } = makeStore(['Missing']);
			const spies = listen(client, ['chatInputCommandDenied', 'commandError']);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			const [error] = spies.chatInputCommandDenied.mock.calls[0];
			expect(error).toBeInstanceOf(UserError);
			expect(error).toMatchObject({ identifier: Identifiers.PreconditionUnavailable, message: 'The precondition "Missing" is not available.' });
			expect(spies.commandError).not.toHaveBeenCalled();
			expect(run).not.toHaveBeenCalled();
		});

		test('GIVEN names and functions THEN they run in the order listed', async () => {
			const calls: string[] = [];
			addPiece('A', { chatInputRun: () => (calls.push('A'), ok()) });
			const { store } = makeStore(['A', () => (calls.push('fn'), ok()), { name: 'A' }]);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(calls).toEqual(['A', 'fn', 'A']);
		});
	});

	describe('global preconditions', () => {
		test('GIVEN pieces with a position THEN they run for every command, in ascending order, before the command ones', async () => {
			const calls: string[] = [];
			addPiece('Late', { position: 20, chatInputRun: () => (calls.push('late'), ok()) });
			addPiece('Early', { position: 10, chatInputRun: () => (calls.push('early'), ok()) });
			addPiece('Local', { chatInputRun: () => (calls.push('local'), ok()) });
			const { store, run } = makeStore(['Local']);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(calls).toEqual(['early', 'late', 'local']);
			expect(run).toHaveBeenCalledOnce();
		});

		test('GIVEN a piece without a position THEN it does not run for commands that do not list it', async () => {
			const chatInputRun = vi.fn(() => ok());
			addPiece('NotGlobal', { chatInputRun });
			const { store } = makeStore(undefined);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(chatInputRun).not.toHaveBeenCalled();
		});

		test('GIVEN a global piece that denies THEN the later and command preconditions and the command do not run', async () => {
			const local = vi.fn(() => ok());
			const later = vi.fn(() => ok());
			addPiece('First', { position: 1, chatInputRun: () => err(new PreconditionError({ precondition: 'First' })) });
			addPiece('Second', { position: 2, chatInputRun: later });
			const { store, run } = makeStore([local]);
			const spies = listen(client, ['chatInputCommandDenied']);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(spies.chatInputCommandDenied.mock.calls[0][0]).toMatchObject({ precondition: 'First' });
			expect(later).not.toHaveBeenCalled();
			expect(local).not.toHaveBeenCalled();
			expect(run).not.toHaveBeenCalled();
		});

		test('GIVEN a global piece without a context menu handler THEN a context menu command is denied', async () => {
			addPiece('ChatOnly', { position: 1, chatInputRun: () => ok() });
			const { store, run } = makeStore(undefined);
			const spies = listen(client, ['contextMenuCommandDenied']);

			await store.runApplicationCommand(makeResponse(), MessageApplicationCommandInteractionData);

			expect(spies.contextMenuCommandDenied.mock.calls[0][0]).toMatchObject({ identifier: Identifiers.PreconditionMissingContextMenuHandler });
			expect(run).not.toHaveBeenCalled();
		});

		test('GIVEN a global piece that is deleted or replaced THEN it stops running', async () => {
			const old = vi.fn(() => ok());
			const replacement = vi.fn(() => ok());
			const deleted = vi.fn(() => ok());
			addPiece('Replaced', { position: 1, chatInputRun: old });
			addPiece('Replaced', { position: 1, chatInputRun: replacement });
			addPiece('Deleted', { position: 2, chatInputRun: deleted });
			container.stores.get('preconditions').delete('Deleted');
			const { store } = makeStore(undefined);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(old).not.toHaveBeenCalled();
			expect(deleted).not.toHaveBeenCalled();
			expect(replacement).toHaveBeenCalledOnce();
		});

		test('GIVEN the store is cleared THEN no global piece runs', async () => {
			const chatInputRun = vi.fn(() => ok());
			addPiece('Global', { position: 1, chatInputRun });
			container.stores.get('preconditions').clear();
			const { store } = makeStore(undefined);

			await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

			expect(chatInputRun).not.toHaveBeenCalled();
		});
	});
});
