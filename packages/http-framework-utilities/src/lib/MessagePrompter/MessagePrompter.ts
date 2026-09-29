import {
	ButtonStyle,
	ComponentType,
	type APIActionRowComponent,
	type APIButtonComponentWithCustomId,
	type APIComponentInMessageActionRow,
	type APIInteractionResponseCallbackData
} from 'discord-api-types/v10';
import {
	InteractionTokenLifetime,
	MaximumTokenLifetime,
	scheduleCleanup,
	type CleanupCredentials,
	type CleanupTarget,
	type TimeoutBehavior
} from '../cleanup.js';
import { createSessionId, encodeCustomId, MessagePrompterHandlerName } from '../custom-id.js';
import { DefaultWrongUserReply, type RunnableInteraction } from '../interactions.js';
import { MessageBuilder } from '../MessageBuilder.js';
import type { PaginatedMessagePage } from '../PaginatedMessage/types.js';
import { registerUtilityHandlers } from '../registration.js';
import { getSessionStore } from '../sessions/config.js';
import type { SessionStore } from '../sessions/SessionStore.js';
import { getPromptWaiters } from './waiters.js';

export type MessagePrompterStrategy = 'confirm' | 'number';

export interface MessagePrompterStrategyReturns {
	confirm: boolean;
	number: number;
}

export interface MessagePrompterOptions {
	/**
	 * How long to wait for an answer, in milliseconds, a positive integer. At most {@linkcode MaximumTokenLifetime}: the
	 * prompt is only editable with the interaction token.
	 * @default 60_000
	 */
	timeout?: number;
	wrongUserReply?: string;
	/**
	 * What happens to the buttons when the prompt times out.
	 * @default 'disable'
	 */
	timeoutBehavior?: TimeoutBehavior;
	/** @default 'Yes' */
	confirmLabel?: string;
	/** @default 'No' */
	cancelLabel?: string;
	/** First number of the `number` strategy. @default 0 */
	start?: number;
	/** Last number (inclusive) of the `number` strategy. @default 10 */
	end?: number;
	/**
	 * The answer is only ever delivered to the process that called {@linkcode MessagePrompter.run}, so this store is
	 * never actually written to; it is only checked for its {@linkcode SessionStore.scope | scope}.
	 * @default getSessionStore()
	 */
	store?: SessionStore;
}

const ButtonsPerRow = 5;
const MaximumButtons = 25;

/**
 * Asks the user a question answered with buttons. The answer must reach the process that called `run`: prompts are
 * not shared through the session store.
 */
export class MessagePrompter<S extends MessagePrompterStrategy = 'confirm'> {
	public readonly message: PaginatedMessagePage;
	public readonly strategy: S;
	public readonly options: MessagePrompterOptions;

	public constructor(message: string | PaginatedMessagePage | MessageBuilder, strategy: S = 'confirm' as S, options: MessagePrompterOptions = {}) {
		const data = typeof message === 'string' ? { content: message } : message instanceof MessageBuilder ? message.toJSON() : message;
		this.message = { content: data.content, embeds: data.embeds, allowed_mentions: data.allowed_mentions };
		this.strategy = strategy;
		this.options = options;
	}

	/**
	 * Replies with the question and waits for the user's answer.
	 * @returns The answer, or `null` when the timeout elapsed.
	 */
	public async run(interaction: RunnableInteraction): Promise<MessagePrompterStrategyReturns[S] | null> {
		const timeout = this.prepareRun(true);
		return this.#prompt(interaction.user.id, timeout, async (payload, createdAt) => {
			await interaction.reply(payload);
			return {
				target: { messageId: '@original', channelId: interaction.channel?.id ?? null, ephemeral: false },
				credentials:
					interaction.applicationId && interaction.token
						? { applicationId: interaction.applicationId, token: interaction.token, tokenExpiresAt: createdAt + InteractionTokenLifetime }
						: null
			};
		});
	}

	/**
	 * Checks what every prompt needs before anything is sent: a process-scoped session store, and a valid timeout.
	 * @param tokenBound Whether the prompt is only editable with an interaction token, which bounds the timeout by
	 * {@linkcode MaximumTokenLifetime}.
	 * @returns The timeout, in milliseconds.
	 */
	protected prepareRun(tokenBound: boolean): number {
		if ((this.options.store ?? getSessionStore()).scope === 'shared') {
			throw new TypeError('MessagePrompter needs a process-scoped session store: its answer is delivered to the process that called run');
		}

		const timeout = this.options.timeout ?? 60_000;
		// An interaction prompt always edits its '@original' response, so the interaction token is its only edit credential.
		if (!Number.isInteger(timeout) || timeout <= 0 || (tokenBound && timeout > MaximumTokenLifetime)) {
			throw new RangeError(
				tokenBound
					? `timeout must be a positive integer of at most ${MaximumTokenLifetime} ms (MaximumTokenLifetime), received ${timeout}`
					: `timeout must be a positive integer, received ${timeout}`
			);
		}

		return timeout;
	}

	/**
	 * Sends the question with its buttons as a bot-owned, non-ephemeral message through `send` (e.g. a gateway reply or
	 * a channel message) and waits for the answer. Its timeout cleanup edits the returned message through the bot's REST
	 * route, so the timeout is not bound by {@linkcode MaximumTokenLifetime}.
	 * @param ownerId The user allowed to answer.
	 * @param send Sends the payload and resolves with the created message's id and channel id.
	 * @returns The answer, or `null` when the timeout elapsed.
	 */
	protected async sendBotPrompt(
		ownerId: string,
		send: (payload: APIInteractionResponseCallbackData) => Promise<{ messageId: string; channelId: string }>
	): Promise<MessagePrompterStrategyReturns[S] | null> {
		const timeout = this.prepareRun(false);
		return this.#prompt(ownerId, timeout, async (payload) => {
			const { messageId, channelId } = await send(payload);
			return { target: { messageId, channelId, ephemeral: false }, credentials: null };
		});
	}

	async #prompt(
		ownerId: string,
		timeout: number,
		send: (
			payload: APIInteractionResponseCallbackData,
			createdAt: number
		) => Promise<{ target: CleanupTarget; credentials: CleanupCredentials | null }>
	): Promise<MessagePrompterStrategyReturns[S] | null> {
		const sessionId = createSessionId();
		const components = this.#components(sessionId);
		await registerUtilityHandlers();

		const waiters = getPromptWaiters();
		let settle!: (value: MessagePrompterStrategyReturns[S] | null) => void;
		const answer = new Promise<MessagePrompterStrategyReturns[S] | null>((resolve) => {
			settle = resolve;
		});

		waiters.set(sessionId, {
			ownerId,
			wrongUserReply: this.options.wrongUserReply ?? DefaultWrongUserReply,
			resolve: (action) => {
				waiters.delete(sessionId);
				settle(this.#parse(action));
			}
		});

		const createdAt = Date.now();
		let sent: { target: CleanupTarget; credentials: CleanupCredentials | null };
		try {
			sent = await send({ ...this.message, components }, createdAt);
		} catch (error) {
			waiters.delete(sessionId);
			throw error;
		}

		// The cleanup timer is the prompt's timeout: it settles the waiter with `null` on release, even when the edit fails.
		scheduleCleanup(sessionId, {
			...sent,
			components,
			behavior: this.options.timeoutBehavior ?? 'disable',
			deadline: createdAt + timeout,
			onRelease: () => {
				if (!waiters.has(sessionId)) return;
				waiters.delete(sessionId);
				settle(null);
			}
		});

		return answer;
	}

	#parse(action: string): MessagePrompterStrategyReturns[S] {
		return (this.strategy === 'confirm' ? action === 'yes' : Number(action)) as MessagePrompterStrategyReturns[S];
	}

	#components(sessionId: string): APIActionRowComponent<APIComponentInMessageActionRow>[] {
		const button = (
			action: string,
			label: string,
			style: ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger
		): APIButtonComponentWithCustomId => ({
			type: ComponentType.Button,
			custom_id: encodeCustomId(MessagePrompterHandlerName, sessionId, action),
			label,
			style
		});

		let buttons: APIButtonComponentWithCustomId[];
		if (this.strategy === 'confirm') {
			buttons = [
				button('yes', this.options.confirmLabel ?? 'Yes', ButtonStyle.Success),
				button('no', this.options.cancelLabel ?? 'No', ButtonStyle.Danger)
			];
		} else {
			const start = this.options.start ?? 0;
			const end = this.options.end ?? 10;
			const count = end - start + 1;
			if (!Number.isInteger(start) || !Number.isInteger(end) || count < 1 || count > MaximumButtons) {
				throw new RangeError(`The number range must contain between 1 and ${MaximumButtons} integers, received ${start}..${end}`);
			}

			buttons = Array.from({ length: count }, (_, i) => button(String(start + i), String(start + i), ButtonStyle.Secondary));
		}

		const rows: APIActionRowComponent<APIComponentInMessageActionRow>[] = [];
		for (let i = 0; i < buttons.length; i += ButtonsPerRow) {
			rows.push({ type: ComponentType.ActionRow, components: buttons.slice(i, i + ButtonsPerRow) });
		}

		return rows;
	}
}
