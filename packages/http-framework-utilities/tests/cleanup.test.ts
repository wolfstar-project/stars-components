import { container } from '@wolfstar/http-framework';
import { UserData } from '@wolfstar/http-framework-test-utils';
import { ButtonStyle, ComponentType, Routes, type APIActionRowComponent, type APIComponentInMessageActionRow } from 'discord-api-types/v10';
import {
	cancelCleanup,
	encodeCustomId,
	getSessionStore,
	MaximumTokenLifetime,
	MessagePrompter,
	PaginatedMessage,
	PaginatedMessageHandlerName,
	refreshCleanup,
	runCleanup,
	scheduleCleanup,
	type CleanupRecord,
	type PaginatedMessageSession
} from '../src/index.js';
import { handleMessagePrompterInteraction } from '../src/lib/MessagePrompter/handle.js';
import { handlePaginatedMessageInteraction } from '../src/lib/PaginatedMessage/handle.js';
import { clickButton, useMemorySessionStore } from './helpers.js';

const owner = UserData.id;
const AppId = '737141877803057244';
const Token = 'SECRET-INTERACTION-TOKEN';
const ChannelId = '222222222222222222';
const RealMessageId = '333333333333333333';
const pmId = (sessionId: string, action: string) => encodeCustomId(PaginatedMessageHandlerName, sessionId, action);

const components: APIActionRowComponent<APIComponentInMessageActionRow>[] = [
	{ type: ComponentType.ActionRow, components: [{ type: ComponentType.Button, style: ButtonStyle.Primary, custom_id: 'a', label: 'A' }] }
];

function fakeInteraction(options: { channel?: boolean } = {}) {
	const get = vi.fn(async () => ({ isOk: () => true, isErr: () => false, unwrap: () => ({ id: RealMessageId }) }));
	return {
		user: { id: owner },
		applicationId: AppId,
		token: Token,
		channel: options.channel === false ? undefined : { id: ChannelId, type: 0 },
		reply: vi.fn(async (_data: unknown) => ({ id: '@original', get })),
		get
	};
}

function record(overrides: Partial<CleanupRecord> = {}): CleanupRecord {
	return {
		target: { messageId: '@original', channelId: ChannelId, ephemeral: false },
		credentials: { applicationId: AppId, token: Token, tokenExpiresAt: Date.now() + MaximumTokenLifetime },
		components,
		behavior: 'disable',
		deadline: Date.now() + 1000,
		...overrides
	};
}

function allDisabled(body: { components: { components: { disabled?: boolean }[] }[] }): boolean {
	return body.components.length > 0 && body.components.flatMap((row) => row.components).every((component) => component.disabled === true);
}

const sessionIds: string[] = [];
function track(sessionId: string): string {
	sessionIds.push(sessionId);
	return sessionId;
}

useMemorySessionStore();

let patch: ReturnType<typeof vi.spyOn>;
let previousRest: typeof container.rest;
beforeEach(() => {
	vi.useFakeTimers();
	// No real REST client in tests: a stub whose methods are spied on, so nothing ever reaches Discord.
	previousRest = container.rest;
	container.rest = { get: async () => ({}), patch: async () => ({}) } as unknown as typeof container.rest;
	patch = vi.spyOn(container.rest, 'patch').mockResolvedValue({});
});

afterEach(() => {
	for (const sessionId of sessionIds.splice(0)) cancelCleanup(sessionId);
	vi.useRealTimers();
	vi.restoreAllMocks();
	container.rest = previousRest;
});

describe('PaginatedMessage timeout cleanup', () => {
	test('GIVEN the idle time elapses THEN edits the original response through the webhook with disabled components', async () => {
		const interaction = fakeInteraction();
		const sessionId = track(await new PaginatedMessage({ idle: 1000 }).addPageContent('a').addPageContent('b').run(interaction));

		await vi.advanceTimersByTimeAsync(999);
		expect(patch).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);

		expect(patch).toHaveBeenCalledOnce();
		const [route, options] = patch.mock.calls[0]! as [string, { body: never; auth?: boolean }];
		expect(route).toBe(Routes.webhookMessage(AppId, Token, '@original'));
		expect(options.auth).toBe(false);
		expect(allDisabled(options.body)).toBe(true);
		expect(sessionId).toMatch(/^[0-9A-Za-z]{12}$/);
	});

	test("GIVEN timeoutBehavior 'remove' THEN sends empty components", async () => {
		const interaction = fakeInteraction();
		track(await new PaginatedMessage({ idle: 1000, timeoutBehavior: 'remove' }).addPageContent('a').run(interaction));

		await vi.advanceTimersByTimeAsync(1000);
		expect(patch).toHaveBeenCalledWith(Routes.webhookMessage(AppId, Token, '@original'), { body: { components: [] }, auth: false });
	});

	test('GIVEN setTimeoutBehavior THEN it is used', async () => {
		const interaction = fakeInteraction();
		track(await new PaginatedMessage({ idle: 1000 }).setTimeoutBehavior('remove').addPageContent('a').run(interaction));

		await vi.advanceTimersByTimeAsync(1000);
		expect(patch.mock.calls[0]![1]).toEqual({ body: { components: [] }, auth: false });
	});

	test('GIVEN the session is evicted from the store before the deadline THEN still edits using the retained target', async () => {
		const interaction = fakeInteraction();
		const sessionId = track(await new PaginatedMessage({ idle: 1000 }).addPageContent('a').addPageContent('b').run(interaction));
		await getSessionStore().delete(sessionId);

		await vi.advanceTimersByTimeAsync(1000);
		expect(patch).toHaveBeenCalledOnce();
		const [route, options] = patch.mock.calls[0]! as [string, { body: never }];
		expect(route).toBe(Routes.webhookMessage(AppId, Token, '@original'));
		expect(allDisabled(options.body)).toBe(true);
	});

	test('GIVEN another replica extended expiresAt THEN the recheck reschedules the cleanup', async () => {
		const interaction = fakeInteraction();
		const sessionId = track(await new PaginatedMessage({ idle: 1000 }).addPageContent('a').addPageContent('b').run(interaction));

		// Another replica handled a click: it wrote a later expiresAt to the store, without touching this process' timer.
		const store = getSessionStore();
		const session = (await store.get(sessionId)) as PaginatedMessageSession;
		await store.set(sessionId, { ...session, expiresAt: Date.now() + 5000 }, 5000);

		await vi.advanceTimersByTimeAsync(1000);
		expect(patch).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(4000);
		expect(patch).toHaveBeenCalledOnce();
	});

	test('GIVEN a click THEN the cleanup deadline is pushed back by the idle time', async () => {
		const interaction = fakeInteraction();
		const sessionId = track(await new PaginatedMessage({ idle: 1000 }).addPageContent('a').addPageContent('b').run(interaction));

		await vi.advanceTimersByTimeAsync(800);
		const click = clickButton(pmId(sessionId, 'next'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);

		await vi.advanceTimersByTimeAsync(900);
		expect(patch).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(100);
		expect(patch).toHaveBeenCalledOnce();
	});

	test('GIVEN a token-only session THEN clicks never extend expiresAt past the token lifetime', async () => {
		const interaction = fakeInteraction();
		const idle = 10 * 60_000;
		const createdAt = Date.now();
		const sessionId = track(await new PaginatedMessage({ idle }).addPageContent('a').addPageContent('b').run(interaction));

		await vi.advanceTimersByTimeAsync(9 * 60_000);
		const click = clickButton(pmId(sessionId, 'next'));
		await handlePaginatedMessageInteraction(click.interaction, click.value);

		const session = (await getSessionStore().get(sessionId)) as PaginatedMessageSession;
		expect(session.expiresAt).toBe(createdAt + MaximumTokenLifetime);
	});

	test('GIVEN stop THEN cancels the cleanup', async () => {
		const interaction = fakeInteraction();
		const sessionId = track(await new PaginatedMessage({ idle: 1000 }).addPageContent('a').addPageContent('b').run(interaction));

		const stop = clickButton(pmId(sessionId, 'stop'));
		await handlePaginatedMessageInteraction(stop.interaction, stop.value);

		await vi.advanceTimersByTimeAsync(5000);
		expect(patch).not.toHaveBeenCalled();
	});

	test('GIVEN an idle above the token lifetime and no channel THEN throws a RangeError before replying', async () => {
		const interaction = fakeInteraction({ channel: false });
		await expect(new PaginatedMessage({ idle: 20 * 60_000 }).addPageContent('a').run(interaction)).rejects.toThrow(RangeError);
		expect(interaction.reply).not.toHaveBeenCalled();
	});

	test('GIVEN an idle above the token lifetime and a channel THEN fetches and stores the real message id', async () => {
		const interaction = fakeInteraction();
		const sessionId = track(await new PaginatedMessage({ idle: 20 * 60_000 }).addPageContent('a').run(interaction));

		expect(interaction.get).toHaveBeenCalledOnce();
		const session = (await getSessionStore().get(sessionId)) as PaginatedMessageSession;
		expect(session.cleanupTarget).toEqual({ messageId: RealMessageId, channelId: ChannelId, ephemeral: false });

		// After the token expired, cleanup falls back to the bot's REST credentials on the channel message.
		await vi.advanceTimersByTimeAsync(20 * 60_000);
		expect(patch).toHaveBeenCalledOnce();
		const [route, options] = patch.mock.calls[0]! as [string, { auth?: boolean }];
		expect(route).toBe(Routes.channelMessage(ChannelId, RealMessageId));
		expect(options.auth).toBeUndefined();
	});

	test('GIVEN fetching the real message id fails THEN falls back to @original, caps the lifetime, and never logs the token', async () => {
		const logError = vi.spyOn(container.logger, 'error').mockImplementation(() => undefined);
		const interaction = fakeInteraction();
		const failure = Object.assign(new Error('Unknown Webhook'), {
			url: `https://discord.com/api/v10/webhooks/${AppId}/${Token}/messages/@original`
		});
		interaction.get.mockResolvedValue({ isOk: () => false, isErr: () => true, unwrap: () => ({ id: '' }), unwrapErr: () => failure } as never);
		const createdAt = Date.now();
		const sessionId = track(await new PaginatedMessage({ idle: 20 * 60_000 }).addPageContent('a').run(interaction));

		const session = (await getSessionStore().get(sessionId)) as PaginatedMessageSession;
		expect(session.cleanupTarget?.messageId).toBe('@original');
		expect(session.expiresAt).toBe(createdAt + MaximumTokenLifetime);
		expect(logError).toHaveBeenCalled();
		expect(JSON.stringify(logError.mock.calls)).not.toContain(Token);
	});
});

describe('cleanup registry', () => {
	test('GIVEN an expired token and a non-ephemeral message with real ids THEN edits through the channel route with the bot token', async () => {
		scheduleCleanup(
			track('expiredtoken'),
			record({
				target: { messageId: RealMessageId, channelId: ChannelId, ephemeral: false },
				credentials: { applicationId: AppId, token: Token, tokenExpiresAt: Date.now() - 1 }
			})
		);
		await runCleanup('expiredtoken');

		expect(patch).toHaveBeenCalledOnce();
		const [route, options] = patch.mock.calls[0]! as [string, { body: never; auth?: boolean }];
		expect(route).toBe(Routes.channelMessage(ChannelId, RealMessageId));
		expect(options).not.toHaveProperty('auth');
		expect(allDisabled(options.body)).toBe(true);
	});

	test('GIVEN an expired token and an ephemeral message THEN does not edit', async () => {
		const onRelease = vi.fn();
		scheduleCleanup(
			track('ephemeralexp'),
			record({
				target: { messageId: RealMessageId, channelId: ChannelId, ephemeral: true },
				credentials: { applicationId: AppId, token: Token, tokenExpiresAt: Date.now() - 1 },
				onRelease
			})
		);
		await runCleanup('ephemeralexp');

		expect(patch).not.toHaveBeenCalled();
		expect(onRelease).toHaveBeenCalledOnce();
	});

	test('GIVEN refreshCleanup THEN the deadline is pushed back', async () => {
		scheduleCleanup(track('refreshed000'), record({ deadline: Date.now() + 1000 }));
		await vi.advanceTimersByTimeAsync(500);
		refreshCleanup('refreshed000', Date.now() + 1000);

		await vi.advanceTimersByTimeAsync(999);
		expect(patch).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		expect(patch).toHaveBeenCalledOnce();
	});

	test('GIVEN refreshCleanup on an unknown session THEN it is a no-op', () => {
		expect(() => refreshCleanup('unknown00000', Date.now() + 1000)).not.toThrow();
	});

	test('GIVEN recheck returns a later deadline THEN reschedules to it', async () => {
		const later = Date.now() + 3000;
		const recheck = vi.fn(async () => (recheck.mock.calls.length === 1 ? later : null));
		scheduleCleanup(track('rechecked000'), record({ recheck }));

		await vi.advanceTimersByTimeAsync(1000);
		expect(recheck).toHaveBeenCalledOnce();
		expect(patch).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(2000);
		expect(patch).toHaveBeenCalledOnce();
	});

	test('GIVEN cancelCleanup THEN releases without editing', async () => {
		const onRelease = vi.fn();
		scheduleCleanup('cancelled000', record({ onRelease }));
		cancelCleanup('cancelled000');
		expect(onRelease).toHaveBeenCalledOnce();

		await vi.advanceTimersByTimeAsync(5000);
		expect(patch).not.toHaveBeenCalled();
	});
});

describe('MessagePrompter timeout cleanup', () => {
	test('GIVEN the PATCH rejects THEN logs without the token and the waiter resolves null', async () => {
		const restError = Object.assign(new Error('Unknown Webhook'), {
			name: 'DiscordAPIError[10015]',
			code: 10015,
			status: 404,
			method: 'PATCH',
			url: `https://discord.com/api/v10/webhooks/${AppId}/${Token}/messages/@original`,
			requestBody: { json: { components: [] } }
		});
		patch.mockRejectedValue(restError);
		const logError = vi.spyOn(container.logger, 'error').mockImplementation(() => undefined);

		const interaction = fakeInteraction();
		const answer = new MessagePrompter('Sure?', 'confirm', { timeout: 1000 }).run(interaction);
		await vi.advanceTimersByTimeAsync(1000);

		await expect(answer).resolves.toBeNull();
		expect(patch).toHaveBeenCalledOnce();
		expect(patch.mock.calls[0]![0]).toBe(Routes.webhookMessage(AppId, Token, '@original'));
		expect(logError).toHaveBeenCalled();
		expect(logError.mock.calls[0]![0]).toBe('[http-framework-utilities] Failed to clean up an expired message');
		expect(JSON.stringify(logError.mock.calls)).not.toContain(Token);
	});

	test('GIVEN an answer THEN cancels the cleanup', async () => {
		const interaction = fakeInteraction();
		const answer = new MessagePrompter('Sure?', 'confirm', { timeout: 1000 }).run(interaction);
		await vi.advanceTimersByTimeAsync(0);

		const payload = interaction.reply.mock.calls[0]![0] as { components: { components: { custom_id: string }[] }[] };
		const click = clickButton(payload.components[0]!.components[0]!.custom_id);
		await handleMessagePrompterInteraction(click.interaction, click.value);
		await expect(answer).resolves.toBe(true);

		await vi.advanceTimersByTimeAsync(5000);
		expect(patch).not.toHaveBeenCalled();
	});

	test("GIVEN timeoutBehavior 'remove' THEN the timed-out prompt loses its components", async () => {
		const interaction = fakeInteraction();
		const answer = new MessagePrompter('Sure?', 'confirm', { timeout: 1000, timeoutBehavior: 'remove' }).run(interaction);
		await vi.advanceTimersByTimeAsync(1000);

		await expect(answer).resolves.toBeNull();
		expect(patch).toHaveBeenCalledWith(Routes.webhookMessage(AppId, Token, '@original'), { body: { components: [] }, auth: false });
	});
});
