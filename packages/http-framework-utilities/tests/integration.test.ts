import { container, StringIdParser, type IIdParser } from '@wolfstar/http-framework';
import { MessageComponentButtonInteractionData, makeResponse, UserData, type MockServerResponse } from '@wolfstar/http-framework-test-utils';
import { ComponentType, InteractionResponseType } from 'discord-api-types/v10';
import {
	encodeCustomId,
	getSessionStore,
	MemorySessionStore,
	PaginatedMessage,
	PaginatedMessageHandlerName,
	registerUtilityHandlers,
	setSessionStore,
	type SessionStore
} from '../src/index.js';

/**
 * Drives a click through the framework's real `InteractionHandlerStore.runHandler`, instead of calling the
 * package's handler function directly, so a regression in `container.idParser` wiring or piece registration is
 * caught too.
 */
describe('integration: InteractionHandlerStore.runHandler', () => {
	let previousIdParser: IIdParser | undefined;
	let previousClient: unknown;
	let previousStore: SessionStore;

	beforeEach(() => {
		previousIdParser = container.idParser;
		previousClient = container.client;
		container.idParser = new StringIdParser();
		// `runHandler` emits lifecycle events on `container.client`; a minimal stub is enough here.
		container.client = { emit: () => true } as never;
		previousStore = getSessionStore();
		setSessionStore(new MemorySessionStore({ sweepInterval: 0 }));
	});

	afterEach(() => {
		container.idParser = previousIdParser as IIdParser;
		container.client = previousClient as never;
		setSessionStore(previousStore);
	});

	test('GIVEN a real next click THEN the store dispatches to the paginated message handler', async () => {
		await registerUtilityHandlers();
		const store = container.stores.get('interaction-handlers');
		await store.loadAll();

		const { sessionId } = await new PaginatedMessage().addPages([{ content: 'one' }, { content: 'two' }]).start(UserData.id);
		const customId = encodeCustomId(PaginatedMessageHandlerName, sessionId, 'next');

		const response = makeResponse();
		const interaction = {
			...MessageComponentButtonInteractionData,
			data: { component_type: ComponentType.Button, custom_id: customId }
		};

		await store.runHandler(response, interaction as never);

		const body = (response as unknown as MockServerResponse).getBodyAsJson<{ type: number; data: { content?: string } }>();
		expect(body).toMatchObject({ type: InteractionResponseType.UpdateMessage, data: { content: 'two' } });
	});
});
