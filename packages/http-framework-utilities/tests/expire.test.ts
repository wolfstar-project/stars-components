import { container } from '@wolfstar/http-framework';
import { UserData } from '@wolfstar/http-framework-test-utils';
import { ButtonStyle, ComponentType, InteractionResponseType, MessageFlags, type APIMessageTopLevelComponent } from 'discord-api-types/v10';
import {
	DefaultExpiredReply,
	DefaultSaveFailedReply,
	disableMessageComponents,
	encodeCustomId,
	expireInteraction,
	getDefaultExpiredReply,
	getDefaultSaveFailedReply,
	getSessionStore,
	MessagePrompterHandlerName,
	PaginatedMessage,
	PaginatedMessageHandlerName,
	setDefaultExpiredReply,
	setDefaultSaveFailedReply
} from '../src/index.js';
import { handleMessagePrompterInteraction } from '../src/lib/MessagePrompter/handle.js';
import { handlePaginatedMessageInteraction } from '../src/lib/PaginatedMessage/handle.js';
import { clickButton, useMemorySessionStore } from './helpers.js';

const owner = UserData.id;
const pmId = (sessionId: string, action: string) => encodeCustomId(PaginatedMessageHandlerName, sessionId, action);
const mpId = (sessionId: string, action: string) => encodeCustomId(MessagePrompterHandlerName, sessionId, action);

useMemorySessionStore();
afterEach(() => vi.restoreAllMocks());

describe('disableMessageComponents', () => {
	test('GIVEN undefined THEN returns an empty array', () => {
		expect(disableMessageComponents(undefined)).toEqual([]);
	});

	test('GIVEN a button row THEN disables the button', () => {
		const components: APIMessageTopLevelComponent[] = [
			{
				type: ComponentType.ActionRow,
				components: [{ type: ComponentType.Button, style: ButtonStyle.Primary, custom_id: 'a', label: 'A' }]
			}
		];
		expect(disableMessageComponents(components)).toEqual([
			{
				type: ComponentType.ActionRow,
				components: [{ type: ComponentType.Button, style: ButtonStyle.Primary, custom_id: 'a', label: 'A', disabled: true }]
			}
		]);
	});

	test('GIVEN a select row THEN disables the select', () => {
		const components: APIMessageTopLevelComponent[] = [
			{
				type: ComponentType.ActionRow,
				components: [{ type: ComponentType.StringSelect, custom_id: 's', options: [{ label: 'a', value: 'a' }] }]
			}
		];
		const [row] = disableMessageComponents(components);
		expect(row!.components[0]).toMatchObject({ custom_id: 's', disabled: true });
	});

	test('GIVEN a link button THEN leaves it unchanged (no custom_id, not disabled)', () => {
		const components: APIMessageTopLevelComponent[] = [
			{
				type: ComponentType.ActionRow,
				components: [{ type: ComponentType.Button, style: ButtonStyle.Link, url: 'https://example.com', label: 'Link' }]
			}
		];
		expect(disableMessageComponents(components)).toEqual([
			{
				type: ComponentType.ActionRow,
				components: [{ type: ComponentType.Button, style: ButtonStyle.Link, url: 'https://example.com', label: 'Link' }]
			}
		]);
	});

	test('GIVEN a non-action-row top-level component THEN it is dropped', () => {
		const components: APIMessageTopLevelComponent[] = [{ type: ComponentType.TextDisplay, content: 'hi' }];
		expect(disableMessageComponents(components)).toEqual([]);
	});
});

describe('expireInteraction', () => {
	test('GIVEN a click THEN updates with disabled components then sends an ephemeral followup', async () => {
		const click = clickButton(pmId('000000000000', 'next'));
		const followup = vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);

		await expireInteraction(click.interaction, DefaultExpiredReply);

		expect(click.body()).toEqual({ type: InteractionResponseType.UpdateMessage, data: { components: [] } });
		expect(followup).toHaveBeenCalledOnce();
		expect(followup).toHaveBeenCalledWith({ content: DefaultExpiredReply, flags: MessageFlags.Ephemeral });
	});

	test('GIVEN followup rejects THEN it is logged and the handler still resolves', async () => {
		const click = clickButton(pmId('000000000000', 'next'));
		const error = new Error('network down');
		vi.spyOn(click.interaction, 'followup').mockRejectedValue(error);
		const logError = vi.spyOn(container.logger, 'error').mockImplementation(() => undefined);

		await expect(expireInteraction(click.interaction, DefaultExpiredReply)).resolves.toBeUndefined();
		expect(logError).toHaveBeenCalled();
	});

	test('GIVEN followup rejects with a REST error carrying the interaction token in its url THEN the token is never logged', async () => {
		const click = clickButton(pmId('000000000000', 'next'));
		const restError = Object.assign(new Error('Unknown Message'), {
			name: 'DiscordAPIError[10008]',
			code: 10008,
			status: 404,
			method: 'POST',
			url: 'https://discord.com/api/v10/webhooks/737141877803057244/SECRET-TOKEN',
			requestBody: { content: DefaultExpiredReply },
			rawError: { message: 'Unknown Message', code: 10008 }
		});
		vi.spyOn(click.interaction, 'followup').mockRejectedValue(restError);
		const logError = vi.spyOn(container.logger, 'error').mockImplementation(() => undefined);

		await expireInteraction(click.interaction, DefaultExpiredReply);

		expect(logError).toHaveBeenCalled();
		expect(JSON.stringify(logError.mock.calls)).not.toContain('SECRET-TOKEN');
	});

	test('GIVEN followup resolves with an Err result carrying the interaction token in its url THEN the token is never logged', async () => {
		const click = clickButton(pmId('000000000000', 'next'));
		const restError = Object.assign(new Error('Unknown Message'), {
			name: 'DiscordAPIError[10008]',
			code: 10008,
			status: 404,
			method: 'POST',
			url: 'https://discord.com/api/v10/webhooks/737141877803057244/SECRET-TOKEN',
			requestBody: { content: DefaultExpiredReply },
			rawError: { message: 'Unknown Message', code: 10008 }
		});
		vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => true, unwrapErr: () => restError } as never);
		const logError = vi.spyOn(container.logger, 'error').mockImplementation(() => undefined);

		await expireInteraction(click.interaction, DefaultExpiredReply);

		expect(logError).toHaveBeenCalled();
		expect(JSON.stringify(logError.mock.calls)).not.toContain('SECRET-TOKEN');
	});
});

describe('PaginatedMessage expiry', () => {
	test('GIVEN an unknown session THEN disables the message components and sends the default expiry notice', async () => {
		const click = clickButton(pmId('000000000000', 'next'));
		const followup = vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);

		await handlePaginatedMessageInteraction(click.interaction, click.value);

		expect(click.body()).toEqual({
			type: InteractionResponseType.UpdateMessage,
			data: { components: disableMessageComponents(click.interaction.message.components) }
		});
		expect(followup).toHaveBeenCalledOnce();
		expect(followup).toHaveBeenCalledWith({ content: DefaultExpiredReply, flags: MessageFlags.Ephemeral });
	});

	test('GIVEN a custom expiredReply and an unavailable custom action THEN the followup uses it', async () => {
		const { sessionId } = await new PaginatedMessage()
			.addPageContent('a')
			.addPageContent('b')
			.setExpiredReply('This page expired, sorry!')
			.start(owner);

		const click = clickButton(pmId(sessionId, 'not-a-real-action'));
		const followup = vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);

		await handlePaginatedMessageInteraction(click.interaction, click.value);

		expect(followup).toHaveBeenCalledWith({ content: 'This page expired, sorry!', flags: MessageFlags.Ephemeral });
	});

	test('GIVEN an undecodable custom id THEN sends the default expiry notice', async () => {
		const click = clickButton(pmId('000000000000', 'next'));
		const followup = vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);

		await handlePaginatedMessageInteraction(click.interaction, 'not-decodable');

		expect(followup).toHaveBeenCalledWith({ content: DefaultExpiredReply, flags: MessageFlags.Ephemeral });
	});
});

describe('MessagePrompter expiry', () => {
	test('GIVEN an unknown session THEN disables the message components and sends the default expiry notice', async () => {
		const click = clickButton(mpId('000000000000', 'yes'));
		const followup = vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);

		await handleMessagePrompterInteraction(click.interaction, click.value);

		expect(click.body()).toEqual({
			type: InteractionResponseType.UpdateMessage,
			data: { components: disableMessageComponents(click.interaction.message.components) }
		});
		expect(followup).toHaveBeenCalledOnce();
		expect(followup).toHaveBeenCalledWith({ content: DefaultExpiredReply, flags: MessageFlags.Ephemeral });
	});

	test('GIVEN an undecodable custom id THEN sends the default expiry notice', async () => {
		const click = clickButton(mpId('000000000000', 'yes'));
		const followup = vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);

		await handleMessagePrompterInteraction(click.interaction, 'not-decodable');

		expect(followup).toHaveBeenCalledWith({ content: DefaultExpiredReply, flags: MessageFlags.Ephemeral });
	});
});

describe('setDefaultExpiredReply', () => {
	const Custom = 'Nothing to see here anymore.';
	afterEach(() => setDefaultExpiredReply(DefaultExpiredReply));

	test('GIVEN no override THEN getDefaultExpiredReply returns DefaultExpiredReply', () => {
		expect(getDefaultExpiredReply()).toBe(DefaultExpiredReply);
	});

	test('GIVEN an override THEN an unknown paginated message session uses it', async () => {
		setDefaultExpiredReply(Custom);
		expect(getDefaultExpiredReply()).toBe(Custom);

		const click = clickButton(pmId('000000000000', 'next'));
		const followup = vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		expect(followup).toHaveBeenCalledWith({ content: Custom, flags: MessageFlags.Ephemeral });
	});

	test('GIVEN an override THEN an undecodable paginated message custom id uses it', async () => {
		setDefaultExpiredReply(Custom);
		const click = clickButton(pmId('000000000000', 'next'));
		const followup = vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);
		await handlePaginatedMessageInteraction(click.interaction, 'not-decodable');
		expect(followup).toHaveBeenCalledWith({ content: Custom, flags: MessageFlags.Ephemeral });
	});

	test('GIVEN an override THEN an unknown or undecodable prompt uses it', async () => {
		setDefaultExpiredReply(Custom);
		const unknown = clickButton(mpId('000000000000', 'yes'));
		const unknownFollowup = vi.spyOn(unknown.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);
		await handleMessagePrompterInteraction(unknown.interaction, unknown.value);
		expect(unknownFollowup).toHaveBeenCalledWith({ content: Custom, flags: MessageFlags.Ephemeral });

		const undecodable = clickButton(mpId('000000000000', 'yes'));
		const undecodableFollowup = vi.spyOn(undecodable.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);
		await handleMessagePrompterInteraction(undecodable.interaction, 'not-decodable');
		expect(undecodableFollowup).toHaveBeenCalledWith({ content: Custom, flags: MessageFlags.Ephemeral });
	});

	test('GIVEN an override THEN it is the default expiredReply of new paginated messages', () => {
		setDefaultExpiredReply(Custom);
		expect(new PaginatedMessage().expiredReply).toBe(Custom);
		expect(new PaginatedMessage({ expiredReply: 'mine' }).expiredReply).toBe('mine');
	});
});

describe('paginated message save failures', () => {
	async function failingClick() {
		const { sessionId } = await new PaginatedMessage().addPageContent('one').addPageContent('two').start(owner);
		const store = getSessionStore();
		vi.spyOn(store, 'set').mockRejectedValue(new Error('down'));
		const click = clickButton(pmId(sessionId, 'next'));
		const followup = vi.spyOn(click.interaction, 'followup').mockResolvedValue({ isErr: () => false } as never);
		const error = vi.spyOn(container.logger, 'error').mockImplementation(() => undefined);
		await handlePaginatedMessageInteraction(click.interaction, click.value);
		return { click, followup, error, store, sessionId };
	}

	test('GIVEN the session cannot be saved THEN keeps the current page and sends the save-failed notice', async () => {
		const { click, followup, error, store, sessionId } = await failingClick();

		const body = click.body();
		expect(body.type).toBe(InteractionResponseType.UpdateMessage);
		expect(body.data.content).toBe('one');
		expect(followup).toHaveBeenCalledOnce();
		expect(followup).toHaveBeenCalledWith({ content: DefaultSaveFailedReply, flags: MessageFlags.Ephemeral });
		expect(error).toHaveBeenCalledWith('[http-framework-utilities] Failed to save a paginated message session', { name: 'Error' });
		expect(await store.get(sessionId)).toMatchObject({ index: 0 });
	});

	test('GIVEN setDefaultSaveFailedReply THEN the notice uses it', async () => {
		expect(getDefaultSaveFailedReply()).toBe('Something went wrong, please try again.');
		setDefaultSaveFailedReply('Try that again later.');
		try {
			const { followup } = await failingClick();
			expect(followup).toHaveBeenCalledWith({ content: 'Try that again later.', flags: MessageFlags.Ephemeral });
		} finally {
			setDefaultSaveFailedReply(DefaultSaveFailedReply);
		}
	});
});
