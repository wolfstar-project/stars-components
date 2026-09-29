import { container, getMissingPermissions } from '@wolfstar/http-framework';
import { computePermissionsIn, getGatewayClient, type AnyChannel, type PermissionsBitField } from '@wolfstar/plugin-gateway';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { isGuildBasedChannel, isThreadChannel, isVoiceBasedChannel } from './type-guards.js';

type Nullish = null | undefined;

/**
 * Computes the permissions of a member in a channel, `computePermissionsIn`'s shape.
 *
 * @internal
 */
export type PermissionsResolver = (channel: AnyChannel, userId: string) => Promise<Readonly<PermissionsBitField>>;

let resolver: PermissionsResolver = computePermissionsIn;

/**
 * Swaps the function computing the bot's permissions, `computePermissionsIn` when called without one. Only meant for
 * tests, which cannot reach Discord to compute real permissions.
 *
 * @internal
 */
export function setPermissionsResolver(value: PermissionsResolver = computePermissionsIn): void {
	resolver = value;
}

/**
 * Whether the bot has every `required` bit in the channel. DMs and group DMs have no permissions to compute: they
 * resolve `dm`. Anything that prevents computing them (no bot user yet, no gateway client, a failed fetch) resolves
 * `false`.
 */
async function has(channel: AnyChannel | Nullish, required: bigint, dm: boolean): Promise<boolean> {
	if (channel == null) return false;
	if (!isGuildBasedChannel(channel)) return dm;

	try {
		const botId = getGatewayClient().user?.id;
		if (botId === undefined) return false;

		const granted = await resolver(channel, botId);
		return getMissingPermissions(granted.bitField, required) === 0n;
	} catch (error) {
		container.logger.debug('[http-framework-utilities] Could not compute the bot permissions in a channel', error);
		return false;
	}
}

function sendBits(channel: AnyChannel | Nullish): bigint {
	return (
		PermissionFlagsBits.ViewChannel | (isThreadChannel(channel) ? PermissionFlagsBits.SendMessagesInThreads : PermissionFlagsBits.SendMessages)
	);
}

export function canReadMessages(channel: AnyChannel | Nullish): Promise<boolean> {
	return has(channel, PermissionFlagsBits.ViewChannel, true);
}

/**
 * Whether the bot can send messages in the channel: `SendMessagesInThreads` instead of `SendMessages` in threads.
 */
export function canSendMessages(channel: AnyChannel | Nullish): Promise<boolean> {
	return has(channel, sendBits(channel), true);
}

export function canSendEmbeds(channel: AnyChannel | Nullish): Promise<boolean> {
	return has(channel, sendBits(channel) | PermissionFlagsBits.EmbedLinks, true);
}

export function canSendAttachments(channel: AnyChannel | Nullish): Promise<boolean> {
	return has(channel, sendBits(channel) | PermissionFlagsBits.AttachFiles, true);
}

export function canReact(channel: AnyChannel | Nullish): Promise<boolean> {
	return has(channel, PermissionFlagsBits.ViewChannel | PermissionFlagsBits.AddReactions | PermissionFlagsBits.ReadMessageHistory, true);
}

/**
 * Whether the bot can remove every reaction of a message in the channel, never in DMs.
 */
export function canRemoveAllReactions(channel: AnyChannel | Nullish): Promise<boolean> {
	return has(channel, PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ManageMessages, false);
}

/**
 * Whether the bot can connect to a voice or stage channel. The channel's user limit is not checked.
 */
export async function canJoinVoiceChannel(channel: AnyChannel | Nullish): Promise<boolean> {
	if (!isVoiceBasedChannel(channel)) return false;
	return has(channel, PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect, false);
}
