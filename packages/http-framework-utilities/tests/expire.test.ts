import { container } from '@wolfstar/http-framework';
import { UserData } from '@wolfstar/http-framework-test-utils';
import { ButtonStyle, ComponentType, InteractionResponseType, MessageFlags, type APIMessageTopLevelComponent } from 'discord-api-types/v10';
import {
	DefaultExpiredReply,
	disableMessageComponents,
	encodeCustomId,
	expireInteraction,
	MessagePrompterHandlerName,
	PaginatedMessage,
	PaginatedMessageHandlerName
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
