import { container } from '@wolfstar/http-framework';
import { Routes, type APIMessage } from 'discord-api-types/v10';
import { PaginatedMessage } from '../PaginatedMessage/PaginatedMessage.js';
import { isInteraction, toReplyOptions, type GatewayTarget } from './targets.js';
import { isMessageInstance } from './type-guards.js';

/**
 * Where a {@linkcode GatewayPaginatedMessage} is sent: an HTTP interaction (replied to), a gateway message (replied
 * to), or a text-based channel (sent to).
 */
export type GatewayPaginatedMessageTarget = GatewayTarget;

/**
 * A {@linkcode PaginatedMessage} that can also be sent from `@wolfstar/plugin-gateway`: as a reply to a gateway
 * `Message`, or to a text-based channel. Clicks still arrive as HTTP interactions and are handled by the
 * `wolfstar-pm` handler, so a gateway bot must serve its interactions endpoint too.
 *
 * Gateway targets are bot-owned, non-ephemeral messages: their timeout cleanup edits them through the bot's
 * `container.rest` on `Routes.channelMessage`, so {@linkcode PaginatedMessage.idle} may exceed `MaximumTokenLifetime`.
 */
export class GatewayPaginatedMessage extends PaginatedMessage {
	/**
	 * Sends the first page and schedules its timeout cleanup.
	 * @param target An HTTP interaction (same as {@linkcode PaginatedMessage.run}, `author` is ignored), a gateway
	 * message to reply to, or a text-based channel to send to.
	 * @param author The user allowed to use the components. Defaults to the message's author for a message, and to
	 * anyone for a channel.
	 * @returns The session id.
	 */
	public override async run(target: GatewayPaginatedMessageTarget, author?: { readonly id: string } | null): Promise<string> {
		if (isMessageInstance(target)) {
			return this.sendBotMessage(author?.id ?? target.author.id, async (payload) => {
				const reply = await target.reply(toReplyOptions(payload));
				return { messageId: reply.id, channelId: target.channelId };
			});
		}

		if (isInteraction(target)) return super.run(target);

		const channelId = target.id;
		return this.sendBotMessage(author?.id ?? null, async (payload) => {
			const message = (await container.rest.post(Routes.channelMessages(channelId), { body: payload })) as APIMessage;
			return { messageId: message.id, channelId };
		});
	}
}
