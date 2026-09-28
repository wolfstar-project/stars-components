import { UserData } from '@wolfstar/http-framework-test-utils';
import { InteractionResponseType, MessageFlags } from 'discord-api-types/v10';
import {
	encodeCustomId,
	getSessionStore,
	MemorySessionStore,
	MessageBuilder,
	PaginatedMessage,
	PaginatedMessageHandlerName,
	setSessionStore
} from '../src/index.js';
import { handlePaginatedMessageInteraction } from '../src/lib/PaginatedMessage/handle.js';
import { clickButton, fakeCommandInteraction, selectOption } from './helpers.js';

const owner = UserData.id;
const id = (sessionId: string, action: string) => encodeCustomId(PaginatedMessageHandlerName, sessionId, action);

beforeEach(() => setSessionStore(new MemorySessionStore({ sweepInterval: 0 })));

describe('PaginatedMessage validation', () => {
	test.each([0, -1, 1.5, Number.NaN])('GIVEN idle %p in the constructor THEN throws a RangeError', (idle) => {
		expect(() => new PaginatedMessage({ idle })).toThrow(RangeError);
	});

	test.each([0, -1, 1.5, Number.NaN])('GIVEN idle %p passed to setIdle THEN throws a RangeError', (idle) => {
		expect(() => new PaginatedMessage().setIdle(idle)).toThrow(RangeError);
	});

	test('GIVEN a positive integer idle THEN it is accepted', () => {
		expect(() => new PaginatedMessage().setIdle(1000)).not.toThrow();
	});

	test('GIVEN a button action with neither label nor emoji THEN addAction throws a TypeError', () => {
		expect(() => new PaginatedMessage().addAction({ id: 'bare', type: 'button' })).toThrow(TypeError);
	});

	test('GIVEN a button action with only a label THEN addAction accepts it', () => {
		expect(() => new PaginatedMessage().addAction({ id: 'labelled', type: 'button', label: 'Go' })).not.toThrow();
	});

	test('GIVEN a button action with only an emoji THEN addAction accepts it', () => {
		expect(() => new PaginatedMessage().addAction({ id: 'emoji', type: 'button', emoji: { name: '➡️' } })).not.toThrow();
	});
});

describe('PaginatedMessage#run', () => {
	test('GIVEN pages THEN replies with the first page and components', async () => {
		const interaction = fakeCommandInteraction(owner);
		const sessionId = await new PaginatedMessage().addPageContent('one').addPageEmbed({ title: 'two' }).run(interaction);

		expect(sessionId).toMatch(/^[0-9A-Za-z]{12}$/);
		const payload = interaction.reply.mock.calls[0]![0] as { content: string; components: unknown[] };
		expect(payload.content).toBe('one');
		expect(payload.components).toHaveLength(2);
	});

	test('GIVEN no pages THEN throws', async () => {
		await expect(new PaginatedMessage().run(fakeCommandInteraction(owner))).rejects.toThrow('PaginatedMessage has no pages');
	});

	test('GIVEN a builder page THEN renders its JSON', async () => {
		const interaction = fakeCommandInteraction(owner);
		await new PaginatedMessage().addPageBuilder((builder) => builder.setContent('built')).run(interaction);
		expect(interaction.reply.mock.calls[0]![0]).toMatchObject({ content: 'built' });
	});

	test('GIVEN an out of range index THEN throws', async () => {
		await expect(new PaginatedMessage().addPageContent('a').setIndex(3).run(fakeCommandInteraction(owner))).rejects.toThrow(RangeError);
	});

	test('GIVEN an over-limit plain object page THEN throws a RangeError', async () => {
		await expect(new PaginatedMessage().addPageContent('a'.repeat(2001)).run(fakeCommandInteraction(owner))).rejects.toThrow(RangeError);
	});
});

describe('handlePaginatedMessageInteraction', () => {
	async function started() {
		return new PaginatedMessage().addPages([{ content: 'one' }, { content: 'two' }, new MessageBuilder().setContent('three')]).start(owner);
	}

	test('GIVEN next THEN updates to the next page', async () => {
		const { sessionId } = await started();
		const click = clickButton(id(sessionId, 'next'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		const body = click.body();
		expect(body.type).toBe(InteractionResponseType.UpdateMessage);
		expect(body.data.content).toBe('two');
	});

	test('GIVEN a page select THEN jumps to that page', async () => {
		const { sessionId } = await started();
		const click = selectOption(id(sessionId, 'select'), '2');
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(click.body().data.content).toBe('three');
	});

	test('GIVEN consecutive clicks THEN the index persists', async () => {
		const { sessionId } = await started();
		for (const expected of ['two', 'three', 'one']) {
			const click = clickButton(id(sessionId, 'next'));
			await handlePaginatedMessageInteraction(click.interaction, click.value);
			expect(click.body().data.content).toBe(expected);
		}
	});

	test('GIVEN another user THEN replies ephemerally with the wrong user reply', async () => {
		const { sessionId } = await started();
		const click = clickButton(id(sessionId, 'next'), '111111111111111111');
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(click.body()).toEqual({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: { content: 'These buttons are not for you.', flags: MessageFlags.Ephemeral }
		});
	});

	test('GIVEN ownerOnly false THEN anyone can click', async () => {
		const { sessionId } = await new PaginatedMessage({ ownerOnly: false }).addPageContent('a').addPageContent('b').start(owner);
		const click = clickButton(id(sessionId, 'next'), '111111111111111111');
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(click.body().data.content).toBe('b');
	});

	test('GIVEN an unknown session THEN removes the components', async () => {
		const click = clickButton(id('000000000000', 'next'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(click.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
	});

	test('GIVEN a component interaction with an undecodable custom id THEN removes the components', async () => {
		const click = clickButton(id('000000000000', 'next'));
		await handlePaginatedMessageInteraction(click.interaction, 'not-decodable');
		expect(click.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
	});

	test('GIVEN stop THEN disables the components and ends the session', async () => {
		const { sessionId } = await started();
		const stop = clickButton(id(sessionId, 'stop'));
		await handlePaginatedMessageInteraction(stop.interaction, stop.value);
		const rows = (stop.body().data.components as { components: { disabled: boolean }[] }[]).flatMap((row) => row.components);
		expect(rows.every((component) => component.disabled)).toBe(true);

		const again = clickButton(id(sessionId, 'next'));
		await handlePaginatedMessageInteraction(again.interaction, again.value);
		expect(again.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
	});

	test('GIVEN stop and a store whose delete rejects THEN still disables the components', async () => {
		const { sessionId } = await started();
		vi.spyOn(getSessionStore(), 'delete').mockRejectedValue(new Error('down'));
		const stop = clickButton(id(sessionId, 'stop'));
		await handlePaginatedMessageInteraction(stop.interaction, stop.value);
		expect(stop.body().type).toBe(InteractionResponseType.UpdateMessage);
		const rows = (stop.body().data.components as { components: { disabled: boolean }[] }[]).flatMap((row) => row.components);
		expect(rows.every((component) => component.disabled)).toBe(true);
	});

	test('GIVEN a custom action THEN runs it and renders the chosen page', async () => {
		const run = vi.fn((context: { setIndex(index: number): void }) => context.setIndex(2));
		const { sessionId } = await new PaginatedMessage()
			.addPages([{ content: 'one' }, { content: 'two' }, { content: 'three' }])
			.addAction({ id: 'jump', type: 'button', label: 'Jump', run })
			.start(owner);
		const click = clickButton(id(sessionId, 'jump'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(run).toHaveBeenCalledOnce();
		expect(click.body().data.content).toBe('three');
	});

	test('GIVEN a function page THEN it is resolved eagerly by PaginatedMessage', async () => {
		const page = vi.fn(() => ({ content: 'lazy' }));
		await new PaginatedMessage().addPageContent('a').addPage(page).start(owner);
		expect(page).toHaveBeenCalledOnce();
	});

	test('GIVEN a store failure THEN removes the components', async () => {
		const { sessionId } = await started();
		setSessionStore({ get: () => Promise.reject(new Error('down')), set: () => undefined, delete: () => undefined });
		const click = clickButton(id(sessionId, 'next'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(click.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
	});
});
