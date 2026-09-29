import { container } from '@wolfstar/http-framework';
import { MessagePrompterHandlerName, PaginatedMessageHandlerName, registerUtilityHandlers } from '../src/index.js';

describe('registerUtilityHandlers', () => {
	test('GIVEN a call THEN both handlers are in the interaction-handlers store', async () => {
		await registerUtilityHandlers();
		await registerUtilityHandlers();
		const store = container.stores.get('interaction-handlers');
		await store.loadAll();
		expect(store.get(PaginatedMessageHandlerName)).toBeDefined();
		expect(store.get(MessagePrompterHandlerName)).toBeDefined();
	});
});
