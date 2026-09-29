import { UserData } from '@wolfstar/http-framework-test-utils';
import { InteractionResponseType, MessageFlags } from 'discord-api-types/v10';
import {
	encodeCustomId,
	getSessionStore,
	MessageBuilder,
	PaginatedMessage,
	PaginatedMessageBuiltinActionIds,
	PaginatedMessageHandlerName,
	setSessionStore
} from '../src/index.js';
import { handlePaginatedMessageInteraction } from '../src/lib/PaginatedMessage/handle.js';
import { clickButton, fakeCommandInteraction, selectOption, useMemorySessionStore } from './helpers.js';

const owner = UserData.id;
const id = (sessionId: string, action: string) => encodeCustomId(PaginatedMessageHandlerName, sessionId, action);

useMemorySessionStore();

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

	test.each(PaginatedMessageBuiltinActionIds)(
		'GIVEN a custom action with run and the built-in id %p THEN addAction throws a TypeError',
		(actionId) => {
			expect(() => new PaginatedMessage().addAction({ id: actionId, type: 'button', label: 'Mine', run: () => undefined })).toThrow(
				`Action id "${actionId}" is reserved for a built-in action; custom actions with a run callback need another id`
			);
		}
	);

	test('GIVEN a built-in id without run THEN addAction accepts it as a restyled default', () => {
		const message = new PaginatedMessage().addAction({ id: 'next', type: 'button', emoji: { name: '👉' } });
		expect(message.actions.get('next')).toEqual({ id: 'next', type: 'button', emoji: { name: '👉' } });
	});

	test('GIVEN PaginatedMessageBuiltinActionIds THEN lists every built-in id', () => {
		expect(PaginatedMessageBuiltinActionIds).toEqual(['first', 'previous', 'next', 'last', 'stop', 'select']);
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

	test('GIVEN stop THEN replaces the session with a tombstone instead of deleting it', async () => {
		const { sessionId } = await started();
		const stop = clickButton(id(sessionId, 'stop'));
		await handlePaginatedMessageInteraction(stop.interaction, stop.value);
		expect(await getSessionStore().get(sessionId)).toEqual({ stopped: true });
	});

	test('GIVEN two concurrent next clicks THEN both apply', async () => {
		const { sessionId } = await started();
		const first = clickButton(id(sessionId, 'next'));
		const second = clickButton(id(sessionId, 'next'));
		await Promise.all([
			handlePaginatedMessageInteraction(first.interaction, first.value),
			handlePaginatedMessageInteraction(second.interaction, second.value)
		]);

		expect(first.body().data.content).toBe('two');
		expect(second.body().data.content).toBe('three');
		expect(await getSessionStore().get(sessionId)).toMatchObject({ index: 2 });
	});

	test('GIVEN a next click racing a stop THEN the stop wins and later clicks expire', async () => {
		const { sessionId } = await started();
		const next = clickButton(id(sessionId, 'next'));
		const stop = clickButton(id(sessionId, 'stop'));
		await Promise.all([
			handlePaginatedMessageInteraction(next.interaction, next.value),
			handlePaginatedMessageInteraction(stop.interaction, stop.value)
		]);

		expect(await getSessionStore().get(sessionId)).toEqual({ stopped: true });
		const again = clickButton(id(sessionId, 'next'));
		await handlePaginatedMessageInteraction(again.interaction, again.value);
		expect(again.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
		expect(await getSessionStore().get(sessionId)).toEqual({ stopped: true });
	});

	test('GIVEN another replica stops the session while a click is handled THEN the click does not resurrect it', async () => {
		const { sessionId } = await started();
		const store = getSessionStore();
		const read = store.get.bind(store);
		let reads = 0;
		// The first read is the click's own load; the stop lands right after it, before the click saves.
		const spy = vi.spyOn(store, 'get').mockImplementation(async (key: string) => {
			const value = await read(key);
			if (++reads === 1) await store.set(key, { stopped: true }, 1000);
			return value;
		});

		const click = clickButton(id(sessionId, 'next'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		spy.mockRestore();

		expect(click.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
		expect(await store.get(sessionId)).toEqual({ stopped: true });
	});

	test('GIVEN stop and a store whose set rejects THEN still disables the components', async () => {
		const { sessionId } = await started();
		vi.spyOn(getSessionStore(), 'set').mockRejectedValue(new Error('down'));
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
		setSessionStore({ scope: 'process', get: () => Promise.reject(new Error('down')), set: () => undefined, delete: () => undefined });
		const click = clickButton(id(sessionId, 'next'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(click.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
	});
});
