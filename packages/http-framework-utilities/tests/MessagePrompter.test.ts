import { UserData } from '@wolfstar/http-framework-test-utils';
import { InteractionResponseType, MessageFlags } from 'discord-api-types/v10';
import { encodeCustomId, MessagePrompter, MessagePrompterHandlerName } from '../src/index.js';
import { handleMessagePrompterInteraction } from '../src/lib/MessagePrompter/handle.js';
import { clickButton, fakeCommandInteraction, useMemorySessionStore } from './helpers.js';

function customIdsOf(interaction: ReturnType<typeof fakeCommandInteraction>): string[] {
	const payload = interaction.reply.mock.calls[0]![0] as { components: { components: { custom_id: string }[] }[] };
	return payload.components.flatMap((row) => row.components.map((component) => component.custom_id));
}

async function flush() {
	await new Promise((resolve) => setImmediate(resolve));
}

describe('MessagePrompter', () => {
	useMemorySessionStore();
	afterEach(() => vi.useRealTimers());

	test('GIVEN confirm and a yes click THEN resolves true and clears the buttons', async () => {
		const interaction = fakeCommandInteraction(UserData.id);
		const result = new MessagePrompter('Sure?').run(interaction);
		await flush();

		const [yes] = customIdsOf(interaction);
		expect(yes).toMatch(/^wolfstar-mp\.[0-9A-Za-z]{12}\.yes$/);
		const click = clickButton(yes!);
		await handleMessagePrompterInteraction(click.interaction, click.value);

		await expect(result).resolves.toBe(true);
		expect(click.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
	});

	test('GIVEN confirm and a no click THEN resolves false', async () => {
		const interaction = fakeCommandInteraction(UserData.id);
		const result = new MessagePrompter({ content: 'Sure?' }, 'confirm').run(interaction);
		await flush();
		const click = clickButton(customIdsOf(interaction)[1]!);
		await handleMessagePrompterInteraction(click.interaction, click.value);
		await expect(result).resolves.toBe(false);
	});

	test('GIVEN number THEN renders start..end buttons and resolves the clicked number', async () => {
		const interaction = fakeCommandInteraction(UserData.id);
		const result = new MessagePrompter('Pick', 'number', { start: 1, end: 7 }).run(interaction);
		await flush();
		const ids = customIdsOf(interaction);
		expect(ids).toHaveLength(7);
		const click = clickButton(ids[3]!);
		await handleMessagePrompterInteraction(click.interaction, click.value);
		await expect(result).resolves.toBe(4);
	});

	test('GIVEN a range over 25 numbers THEN throws', async () => {
		await expect(new MessagePrompter('Pick', 'number', { start: 0, end: 25 }).run(fakeCommandInteraction(UserData.id))).rejects.toThrow(
			RangeError
		);
	});

	test('GIVEN another user THEN replies ephemerally and keeps waiting', async () => {
		const interaction = fakeCommandInteraction(UserData.id);
		const result = new MessagePrompter('Sure?').run(interaction);
		await flush();
		const [yes] = customIdsOf(interaction);

		const intruder = clickButton(yes!, '111111111111111111');
		await handleMessagePrompterInteraction(intruder.interaction, intruder.value);
		expect(intruder.body()).toEqual({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: { content: 'These buttons are not for you.', flags: MessageFlags.Ephemeral }
		});

		const owner = clickButton(yes!);
		await handleMessagePrompterInteraction(owner.interaction, owner.value);
		await expect(result).resolves.toBe(true);
	});

	test('GIVEN a timeout THEN resolves null and later clicks remove the buttons', async () => {
		vi.useFakeTimers();
		const interaction = fakeCommandInteraction(UserData.id);
		const result = new MessagePrompter('Sure?', 'confirm', { timeout: 1000 }).run(interaction);
		await vi.advanceTimersByTimeAsync(0);
		const [yes] = customIdsOf(interaction);
		await vi.advanceTimersByTimeAsync(1000);
		await expect(result).resolves.toBeNull();

		vi.useRealTimers();
		const click = clickButton(yes!);
		await handleMessagePrompterInteraction(click.interaction, click.value);
		expect(click.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
	});

	test('GIVEN a component interaction with an undecodable custom id THEN removes the components', async () => {
		const click = clickButton(encodeCustomId(MessagePrompterHandlerName, '000000000000', 'yes'));
		await handleMessagePrompterInteraction(click.interaction, 'not-decodable');
		expect(click.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
	});

	test('GIVEN reply rejects THEN run rejects and clears the pending timer', async () => {
		vi.useFakeTimers();
		const interaction = fakeCommandInteraction(UserData.id);
		interaction.reply = vi.fn(async () => {
			throw new Error('failed to reply');
		});

		await expect(new MessagePrompter('Sure?').run(interaction)).rejects.toThrow('failed to reply');
		expect(vi.getTimerCount()).toBe(0);
	});

	test('GIVEN the handler name THEN custom ids target wolfstar-mp', () => {
		expect(encodeCustomId(MessagePrompterHandlerName, 'abcDEF123456', 'yes')).toBe('wolfstar-mp.abcDEF123456.yes');
	});
});
