import { UserData } from '@wolfstar/http-framework-test-utils';
import {
	encodeCustomId,
	LazyPaginatedMessage,
	MemorySessionStore,
	PaginatedFieldMessageEmbed,
	PaginatedMessageEmbedFields,
	PaginatedMessageHandlerName,
	setSessionStore
} from '../src/index.js';
import { handlePaginatedMessageInteraction } from '../src/lib/PaginatedMessage/handle.js';
import { clickButton } from './helpers.js';

beforeEach(() => setSessionStore(new MemorySessionStore({ sweepInterval: 0 })));

describe('LazyPaginatedMessage', () => {
	test('GIVEN function pages THEN only resolves them when displayed', async () => {
		const second = vi.fn(() => ({ content: 'two' }));
		const { sessionId } = await new LazyPaginatedMessage()
			.addPage(() => ({ content: 'one' }))
			.addPage(second)
			.start(UserData.id);
		expect(second).not.toHaveBeenCalled();

		const click = clickButton(encodeCustomId(PaginatedMessageHandlerName, sessionId, 'next'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(second).toHaveBeenCalledOnce();
		expect(click.body().data.content).toBe('two');
	});
});

describe('PaginatedMessageEmbedFields', () => {
	test('GIVEN 25 fields at 10 per page THEN makes 3 pages from the template', async () => {
		const fields = Array.from({ length: 25 }, (_, i) => ({ name: `n${i}`, value: `v${i}` }));
		const message = new PaginatedMessageEmbedFields().setTemplate({ title: 'List', color: 1 }).setItems(fields).setItemsPerPage(10).make();
		expect(message.pages).toHaveLength(3);
		expect(await message.resolvePage(2)).toEqual({ embeds: [{ title: 'List', color: 1, fields: fields.slice(20) }] });
	});

	test('GIVEN more than 25 per page THEN throws', () => {
		expect(() => new PaginatedMessageEmbedFields().setItemsPerPage(26)).toThrow(RangeError);
	});
});

describe('PaginatedFieldMessageEmbed', () => {
	test('GIVEN items and a formatter THEN renders one field per page', async () => {
		const message = new PaginatedFieldMessageEmbed<number>()
			.setTemplate({ color: 2 })
			.setTitleField('Numbers')
			.setItems([1, 2, 3])
			.formatItems((item, index) => `${index + 1}. ${item * 10}`)
			.setItemsPerPage(2)
			.make();
		expect(message.pages).toHaveLength(2);
		expect(await message.resolvePage(0)).toEqual({ embeds: [{ color: 2, fields: [{ name: 'Numbers', value: '1. 10\n2. 20' }] }] });
		expect(await message.resolvePage(1)).toEqual({ embeds: [{ color: 2, fields: [{ name: 'Numbers', value: '3. 30' }] }] });
	});

	test('GIVEN no title field THEN make throws', () => {
		expect(() => new PaginatedFieldMessageEmbed<string>().setItems(['a']).make()).toThrow('PaginatedFieldMessageEmbed requires a title field');
	});
});
