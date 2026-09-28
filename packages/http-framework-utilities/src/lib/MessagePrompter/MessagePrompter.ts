import {
	ButtonStyle,
	ComponentType,
	type APIActionRowComponent,
	type APIButtonComponentWithCustomId,
	type APIComponentInMessageActionRow
} from 'discord-api-types/v10';
import { createSessionId, encodeCustomId, MessagePrompterHandlerName } from '../custom-id.js';
import { DefaultWrongUserReply, type RunnableInteraction } from '../interactions.js';
import { MessageBuilder } from '../MessageBuilder.js';
import type { PaginatedMessagePage } from '../PaginatedMessage/types.js';
import { registerUtilityHandlers } from '../registration.js';
import { getPromptWaiters } from './waiters.js';

export type MessagePrompterStrategy = 'confirm' | 'number';

export interface MessagePrompterStrategyReturns {
	confirm: boolean;
	number: number;
}

export interface MessagePrompterOptions {
	/**
	 * How long to wait for an answer, in milliseconds.
	 * @default 60_000
	 */
	timeout?: number;
	wrongUserReply?: string;
	/** @default 'Yes' */
	confirmLabel?: string;
	/** @default 'No' */
	cancelLabel?: string;
	/** First number of the `number` strategy. @default 0 */
	start?: number;
	/** Last number (inclusive) of the `number` strategy. @default 10 */
	end?: number;
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
		const sessionId = createSessionId();
		const components = this.#components(sessionId);
		await registerUtilityHandlers();

		const waiters = getPromptWaiters();
		const answer = new Promise<MessagePrompterStrategyReturns[S] | null>((resolve) => {
			const timer = setTimeout(() => {
				waiters.delete(sessionId);
				resolve(null);
			}, this.options.timeout ?? 60_000);

			waiters.set(sessionId, {
				ownerId: interaction.user.id,
				wrongUserReply: this.options.wrongUserReply ?? DefaultWrongUserReply,
				resolve: (action) => {
					clearTimeout(timer);
					waiters.delete(sessionId);
					resolve(this.#parse(action));
				}
			});
		});

		try {
			await interaction.reply({ ...this.message, components });
		} catch (error) {
			// The caller gets the rejection; the pending timer later settles the unobserved promise with `null`.
			waiters.delete(sessionId);
			throw error;
		}

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
