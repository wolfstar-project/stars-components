import { UserData } from '@wolfstar/http-framework-test-utils';
import {
	encodeCustomId,
	LazyPaginatedMessage,
	PaginatedFieldMessageEmbed,
	PaginatedMessageEmbedFields,
	PaginatedMessageHandlerName
} from '../src/index.js';
import { handlePaginatedMessageInteraction } from '../src/lib/PaginatedMessage/handle.js';
import { clickButton, useMemorySessionStore } from './helpers.js';

useMemorySessionStore();

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

	test('GIVEN make is called twice THEN the second call replaces the pages from the first, even once resolved', async () => {
		const first = Array.from({ length: 4 }, (_, i) => ({ name: `first${i}`, value: `v${i}` }));
		const second = Array.from({ length: 2 }, (_, i) => ({ name: `second${i}`, value: `v${i}` }));
		const message = new PaginatedMessageEmbedFields().setTemplate({ title: 'List' }).setItems(first).setItemsPerPage(2).make();
		await message.resolvePage(0);
		message.setItems(second).make();

		expect(message.pages).toHaveLength(1);
		expect(await message.resolvePage(0)).toEqual({ embeds: [{ title: 'List', fields: second }] });
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

	test('GIVEN make is called twice THEN the second call replaces the pages from the first, even once resolved', async () => {
		const message = new PaginatedFieldMessageEmbed<number>()
			.setTemplate({ color: 2 })
			.setTitleField('Numbers')
			.setItems([1, 2, 3])
			.formatItems((item) => `${item}`)
			.setItemsPerPage(2)
			.make();
		await message.resolvePage(0);
		message.setItems([4, 5]).setItemsPerPage(2).make();

		expect(message.pages).toHaveLength(1);
		expect(await message.resolvePage(0)).toEqual({ embeds: [{ color: 2, fields: [{ name: 'Numbers', value: '4\n5' }] }] });
	});

	test('GIVEN a field value over 1024 characters THEN resolving the page throws a RangeError', async () => {
		const message = new PaginatedFieldMessageEmbed<string>()
			.setTitleField('Long')
			.setItems(['x'.repeat(1025)])
			.formatItems((item) => item)
			.setItemsPerPage(1)
			.make();
		await expect(message.resolvePage(0)).rejects.toThrow(RangeError);
	});
});
