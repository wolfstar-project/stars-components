import { container } from '@wolfstar/http-framework';
import { getGatewayClient, ReactionEmoji, type Message } from '@wolfstar/plugin-gateway';
import { ChannelType, GatewayIntentBits, Routes, type APIMessage } from 'discord-api-types/v10';
import { describeRestError } from '../errors.js';
import type { RunnableInteraction } from '../interactions.js';
import {
	MessagePrompter,
	type MessagePrompterOptions,
	type MessagePrompterStrategy,
	type MessagePrompterStrategyReturns
} from '../MessagePrompter/MessagePrompter.js';
import type { MessageBuilder } from '../MessageBuilder.js';
import type { PaginatedMessagePage } from '../PaginatedMessage/types.js';
import { awaitMessages, awaitReactions } from './collectors.js';
import { isInteraction, toReplyOptions, type GatewayTarget } from './targets.js';
import { isGuildBasedChannel, isMessageInstance } from './type-guards.js';

export type GatewayMessagePrompterStrategy = MessagePrompterStrategy | 'message' | 'reaction';

export interface GatewayMessagePrompterStrategyReturns extends MessagePrompterStrategyReturns {
	/** The author's next message in the channel. */
	message: Message;
	/** The chosen entry of {@linkcode GatewayMessagePrompterOptions.reactions}, as it was configured. */
	reaction: string;
}

export interface GatewayMessagePrompterOptions extends MessagePrompterOptions {
	/**
	 * The emojis the `reaction` strategy reacts with, in order: Unicode emojis (`'✅'`), or custom emojis as `name:id`
	 * (`<:name:id>` and `<a:name:id>` are accepted too). A reaction matches an entry by the custom emoji's id, else by the
	 * Unicode emoji itself.
	 * @default ['✅', '❌']
	 */
	reactions?: string[];
}

/**
 * Where a {@linkcode GatewayMessagePrompter} is sent: an HTTP interaction (replied to), a gateway message (replied to),
 * or a text-based channel (sent to).
 */
export type GatewayMessagePrompterTarget = GatewayTarget;

type CollectingStrategy = 'message' | 'reaction';

const DefaultReactions = ['✅', '❌'];

const RequiredIntents = {
	message: { guild: ['GuildMessages', 'MessageContent'], dm: ['DirectMessages', 'MessageContent'] },
	reaction: { guild: ['GuildMessageReactions'], dm: ['DirectMessageReactions'] }
} as const satisfies Record<CollectingStrategy, Record<'guild' | 'dm', readonly (keyof typeof GatewayIntentBits)[]>>;

/**
 * How a reaction's emoji is matched against the configured ones: a custom emoji by its id, a Unicode one by itself.
 */
function emojiKey(emoji: { id?: string | null; name?: string | null }): string | null {
	return emoji.id ?? emoji.name ?? null;
}

/**
 * Throws unless the gateway client identifies with every intent the strategy needs in this kind of channel.
 */
function assertIntents(strategy: CollectingStrategy, dm: boolean): void {
	let intents: number;
	try {
		intents = Number((getGatewayClient().options as { intents?: unknown }).intents ?? 0);
	} catch {
		throw new Error(`GatewayMessagePrompter "${strategy}" strategy needs a GatewayClient from @wolfstar/plugin-gateway`);
	}

	const missing = RequiredIntents[strategy][dm ? 'dm' : 'guild'].filter((name) => (intents & GatewayIntentBits[name]) === 0);
	if (missing.length > 0) throw new Error(`GatewayMessagePrompter "${strategy}" strategy needs the ${missing.join(' and ')} gateway intents`);
}

interface MessageResult {
	isOk(): boolean;
	unwrap(): { id: string };
	unwrapErr(): unknown;
}

/**
 * Reads the real id of an interaction's reply through `@wolfstar/http-framework`'s `PartialMessage#get()`.
 */
async function fetchReplyId(response: unknown): Promise<string> {
	const get = (response as { get?: unknown } | null | undefined)?.get;
	if (typeof get === 'function') {
		try {
			const result = (await get.call(response)) as MessageResult;
			if (result.isOk()) return result.unwrap().id;
			container.logger.error('[http-framework-utilities] Failed to fetch a prompt', describeRestError(result.unwrapErr()));
		} catch (error) {
			container.logger.error('[http-framework-utilities] Failed to fetch a prompt', describeRestError(error));
		}
	}

	throw new Error('GatewayMessagePrompter could not fetch its reply to react to it');
}

/**
 * A {@linkcode MessagePrompter} that can also be sent from `@wolfstar/plugin-gateway` (as a reply to a gateway
 * `Message`, or to a text-based channel), and that adds `@sapphire/discord.js-utilities`' `message` and `reaction`
 * strategies:
 *
 * - `confirm` / `number`: buttons, answered through HTTP interactions like {@linkcode MessagePrompter}. On a gateway
 *   target the prompt is a bot-owned message, so its timeout is not bound by `MaximumTokenLifetime`.
 * - `message`: resolves with the author's next message in the channel. Needs the `GuildMessages` (or
 *   `DirectMessages`) and `MessageContent` intents.
 * - `reaction`: reacts with {@linkcode GatewayMessagePrompterOptions.reactions} and resolves with the one the author
 *   picks. Needs the `GuildMessageReactions` (or `DirectMessageReactions`) intent.
 *
 * The `message` and `reaction` strategies throw before sending when the gateway client lacks their intents. Like
 * {@linkcode MessagePrompter}, every strategy needs a process-scoped session store. On an HTTP interaction, the timeout
 * of every strategy stays bound by `MaximumTokenLifetime`.
 */
// `MessagePrompter<any>`: the base class' generic only knows the button strategies, and `run` is widened below.
// oxlint-disable-next-line typescript/no-explicit-any
export class GatewayMessagePrompter<S extends GatewayMessagePrompterStrategy = 'confirm'> extends MessagePrompter<any> {
	declare public readonly strategy: S;
	declare public readonly options: GatewayMessagePrompterOptions;

	public constructor(
		message: string | PaginatedMessagePage | MessageBuilder,
		strategy: S = 'confirm' as S,
		options: GatewayMessagePrompterOptions = {}
	) {
		super(message, strategy, options);
	}

	/**
	 * Sends the question and waits for the answer.
	 * @param target An HTTP interaction (replied to, `author` is ignored), a gateway message (replied to), or a
	 * text-based channel (sent to).
	 * @param author The user allowed to answer. Defaults to the interaction's user or the message's author; required for
	 * a channel.
	 * @returns The answer, or `null` when the timeout elapsed.
	 */
	public override async run(
		target: GatewayMessagePrompterTarget,
		author?: { readonly id: string } | null
	): Promise<GatewayMessagePrompterStrategyReturns[S] | null> {
		if (this.strategy === 'message' || this.strategy === 'reaction') return this.#collect(this.strategy, target, author);

		if (isMessageInstance(target)) {
			return this.sendBotPrompt(author?.id ?? target.author.id, async (payload) => {
				const reply = await target.reply(toReplyOptions(payload));
				return { messageId: reply.id, channelId: target.channelId };
			});
		}

		if (isInteraction(target)) return super.run(target);

		const ownerId = requireAuthor(author);
		return this.sendBotPrompt(ownerId, async (payload) => {
			const message = (await container.rest.post(Routes.channelMessages(target.id), { body: payload })) as APIMessage;
			return { messageId: message.id, channelId: target.id };
		});
	}

	async #collect(
		strategy: CollectingStrategy,
		target: GatewayMessagePrompterTarget,
		author: { readonly id: string } | null | undefined
	): Promise<GatewayMessagePrompterStrategyReturns[S] | null> {
		const message = isMessageInstance(target) ? target : null;
		const interaction = message === null && isInteraction(target) ? target : null;
		const timeout = this.prepareRun(interaction !== null);

		const reactions = this.options.reactions ?? DefaultReactions;
		const keys = reactions.map((emoji) => emojiKey(ReactionEmoji.resolvePartial(emoji)));
		if (strategy === 'reaction' && (keys.length === 0 || keys.includes(null))) {
			throw new RangeError(`reactions must be a non-empty list of emojis, received ${JSON.stringify(reactions)}`);
		}

		let ownerId: string;
		let channelId: string;
		let dm: boolean;
		let send: () => Promise<string | null>;
		if (message !== null) {
			ownerId = author?.id ?? message.author.id;
			channelId = message.channelId;
			dm = message.guildId == null;
			send = async () => (await message.reply(toReplyOptions(this.message))).id;
		} else if (interaction !== null) {
			const channel = interaction.channel as { readonly id: string; readonly type?: ChannelType } | undefined;
			if (channel === undefined) throw new TypeError(`GatewayMessagePrompter "${strategy}" strategy needs the interaction's channel`);
			ownerId = interaction.user.id;
			channelId = channel.id;
			dm = channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM;
			send = async () => {
				const response = await interaction.reply(this.message);
				return strategy === 'reaction' ? fetchReplyId(response) : null;
			};
		} else {
			const channel = target as Exclude<GatewayMessagePrompterTarget, Message | RunnableInteraction>;
			ownerId = requireAuthor(author);
			channelId = channel.id;
			dm = !isGuildBasedChannel(channel);
			send = async () => ((await container.rest.post(Routes.channelMessages(channel.id), { body: this.message })) as APIMessage).id;
		}

		assertIntents(strategy, dm);
		const messageId = await send();

		if (strategy === 'message') {
			const [answer] = await awaitMessages(
				{ id: channelId },
				{ filter: (candidate) => candidate.author.id === ownerId, max: 1, time: timeout }
			);
			return (answer ?? null) as GatewayMessagePrompterStrategyReturns[S] | null;
		}

		const prompt = { id: messageId!, channelId };
		// Listen before reacting, so an answer given while the bot is still reacting is not missed.
		const collected = awaitReactions(prompt, {
			filter: ({ reaction, userId }) => userId === ownerId && keys.includes(emojiKey(reaction.emoji)),
			max: 1,
			time: timeout
		});

		for (const emoji of reactions) {
			try {
				await container.rest.put(Routes.channelMessageOwnReaction(channelId, prompt.id, ReactionEmoji.resolveIdentifier(emoji)));
			} catch (error) {
				container.logger.error('[http-framework-utilities] Failed to react to a prompt', describeRestError(error));
				break;
			}
		}

		const [answer] = await collected;
		return (answer ? reactions[keys.indexOf(emojiKey(answer.reaction.emoji))]! : null) as GatewayMessagePrompterStrategyReturns[S] | null;
	}
}

function requireAuthor(author: { readonly id: string } | null | undefined): string {
	if (author == null) throw new TypeError('GatewayMessagePrompter needs an author to prompt in a channel');
	return author.id;
}
