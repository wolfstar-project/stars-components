import { container } from '@sapphire/pieces';
import { err, ok } from '@sapphire/result';
import {
	ChatInputApplicationCommandInteractionData,
	MessageApplicationCommandInteractionData,
	TestableClient,
	UserApplicationCommandInteractionData,
	makeResponse
} from '@wolfstar/http-framework-test-utils';
import {
	CommandStore,
	PreconditionError,
	UserError,
	runPreconditions,
	type ClientEvents,
	type Command,
	type Precondition
} from '../../../src/index.js';

function listen(client: TestableClient, events: readonly (keyof ClientEvents)[]) {
	const spies = Object.fromEntries(events.map((event) => [event, vi.fn()])) as Record<keyof ClientEvents, ReturnType<typeof vi.fn>>;
	for (const event of events) client.on(event, spies[event] as never);
	return spies;
}

function makeStore(preconditions: readonly Precondition[] | undefined, run = vi.fn(() => 'ran')) {
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

const deny = (name: string) => () => err(new PreconditionError({ precondition: name }));

describe('Command preconditions', () => {
	let client: TestableClient;

	beforeEach(() => {
		client = new TestableClient();
		container.client = client;
		client.on('error', () => {});
	});

	test('GIVEN no preconditions THEN the command runs', async () => {
		const { store, run } = makeStore(undefined);
		const spies = listen(client, ['commandSuccess', 'chatInputCommandDenied']);

		await store.runApplicationCommand(makeResponse(), ChatInputApplicationCommandInteractionData);

		expect(run).toHaveBeenCalledOnce();
		expect(spies.commandSuccess).toHaveBeenCalledOnce();
		expect(spies.chatInputCommandDenied).not.toHaveBeenCalled();
	});

	test('GIVEN preconditions that all pass THEN they run in order, with the interaction and the command, before the command', async () => {
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

	test('GIVEN a precondition that denies a chat input command THEN chatInputCommandDenied is emitted and the command does not run', async () => {
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
	])('GIVEN a precondition that denies a %s context menu command THEN contextMenuCommandDenied is emitted', async (_type, interaction) => {
		const { store, run } = makeStore([deny('Owner')]);
		const spies = listen(client, ['chatInputCommandDenied', 'contextMenuCommandDenied', 'commandError']);

		await store.runApplicationCommand(makeResponse(), interaction);

		expect(spies.contextMenuCommandDenied).toHaveBeenCalledOnce();
		expect(spies.chatInputCommandDenied).not.toHaveBeenCalled();
		expect(spies.commandError).not.toHaveBeenCalled();
		expect(run).not.toHaveBeenCalled();
	});

	test('GIVEN a precondition that throws a generic Error THEN commandError is emitted and the command does not run', async () => {
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

	test('GIVEN a precondition that throws a UserError THEN chatInputCommandDenied is emitted', async () => {
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
		const { store, command } = makeStore([precondition]);
		(command as unknown as { autocompleteRun: () => void }).autocompleteRun = vi.fn();
		vi.spyOn(store.router, 'getChatInput').mockReturnValue(command);

		const { ApplicationCommandAutocompleteInteractionData } = await import('@wolfstar/http-framework-test-utils');
		await store.runApplicationCommandAutocomplete(makeResponse(), ApplicationCommandAutocompleteInteractionData);

		expect(precondition).not.toHaveBeenCalled();
	});
});

describe('runPreconditions', () => {
	test('GIVEN an empty list THEN returns ok', async () => {
		const result = await runPreconditions([], {} as never, {} as never);
		expect(result.isOk()).toBe(true);
	});

	test('GIVEN a failing precondition THEN returns its Err and skips the rest', async () => {
		const later = vi.fn(() => ok());
		const result = await runPreconditions([deny('A'), later], {} as never, {} as never);

		expect(result.isErr()).toBe(true);
		expect(result.unwrapErr()).toMatchObject({ precondition: 'A' });
		expect(later).not.toHaveBeenCalled();
	});
});
