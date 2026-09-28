import { getMissingPermissions } from '@wolfstar/http-framework';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { isThreadChannel, isVoiceBasedChannel, type ChannelLike, type Nullish } from './type-guards.js';

/**
 * Where the application's permissions come from: a bitfield, its string form, or anything carrying the interaction's
 * `app_permissions` (raw payloads and `@wolfstar/http-framework` interactions alike).
 */
export type PermissionsSource = bigint | string | { readonly app_permissions?: string | null } | Nullish;

const Digits = /^\d+$/;

/**
 * Resolves the application's permissions, `null` when the source carries none.
 */
export function resolveAppPermissions(source: PermissionsSource): bigint | null {
	if (source == null) return null;
	if (typeof source === 'bigint') return source;

	const raw = typeof source === 'string' ? source : source.app_permissions;
	return typeof raw === 'string' && Digits.test(raw) ? BigInt(raw) : null;
}

function has(source: PermissionsSource, required: bigint): boolean {
	const granted = resolveAppPermissions(source);
	return granted !== null && getMissingPermissions(granted, required) === 0n;
}

function sendBits(channel: ChannelLike | Nullish): bigint {
	return (
		PermissionFlagsBits.ViewChannel | (isThreadChannel(channel) ? PermissionFlagsBits.SendMessagesInThreads : PermissionFlagsBits.SendMessages)
	);
}

export function canReadMessages(source: PermissionsSource): boolean {
	return has(source, PermissionFlagsBits.ViewChannel);
}

export function canSendMessages(source: PermissionsSource, channel?: ChannelLike | Nullish): boolean {
	return has(source, sendBits(channel));
}

export function canSendEmbeds(source: PermissionsSource, channel?: ChannelLike | Nullish): boolean {
	return has(source, sendBits(channel) | PermissionFlagsBits.EmbedLinks);
}

export function canSendAttachments(source: PermissionsSource, channel?: ChannelLike | Nullish): boolean {
	return has(source, sendBits(channel) | PermissionFlagsBits.AttachFiles);
}

export function canReact(source: PermissionsSource): boolean {
	return has(source, PermissionFlagsBits.ViewChannel | PermissionFlagsBits.AddReactions | PermissionFlagsBits.ReadMessageHistory);
}

export function canRemoveAllReactions(source: PermissionsSource): boolean {
	return has(source, PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ManageMessages);
}

/**
 * Whether the application can connect to a voice channel. The channel's user limit is not part of the payload and is
 * not checked.
 */
export function canJoinVoiceChannel(source: PermissionsSource, channel?: ChannelLike | Nullish): boolean {
	if (channel != null && !isVoiceBasedChannel(channel)) return false;
	return has(source, PermissionFlagsBits.ViewChannel | PermissionFlagsBits.Connect);
}
