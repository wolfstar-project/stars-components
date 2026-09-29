import type { Message, MessageCreateOptions } from '@wolfstar/plugin-gateway';
import type { APIInteractionResponseCallbackData } from 'discord-api-types/v10';
import type { RunnableInteraction } from '../interactions.js';
import type { TextBasedChannel } from './type-guards.js';

/**
 * Where a gateway-capable interactive message is sent: an HTTP interaction (replied to), a gateway message (replied
 * to), or a text-based channel (sent to).
 */
export type GatewayTarget = RunnableInteraction | Message | TextBasedChannel;

/**
 * Whether the target is an HTTP interaction. Check for a gateway `Message` first: channels have no `reply`, messages do.
 * @internal
 */
export function isInteraction(target: GatewayTarget): target is RunnableInteraction {
	return 'user' in target && typeof (target as { reply?: unknown }).reply === 'function';
}

/**
 * Converts a raw payload into `Message#reply` options. Its `allowed_mentions` become camel-cased `allowedMentions`, so
 * they win over the client's default allowed mentions like they do for a raw REST body.
 * @internal
 */
export function toReplyOptions({ allowed_mentions, ...rest }: APIInteractionResponseCallbackData): MessageCreateOptions {
	const options = rest as MessageCreateOptions;
	if (allowed_mentions === undefined) return options;

	const { replied_user, ...mentions } = allowed_mentions;
	return { ...options, allowedMentions: replied_user === undefined ? mentions : { ...mentions, repliedUser: replied_user } };
}
