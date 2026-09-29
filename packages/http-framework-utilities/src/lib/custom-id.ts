import { ButtonLimits } from '@wolfstar/discord-utilities';

export const PaginatedMessageHandlerName = 'wolfstar-pm';
export const MessagePrompterHandlerName = 'wolfstar-mp';
export const SessionIdLength = 12;

const Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * @internal
 */
export function createSessionId(): string {
	let id = '';
	for (const byte of crypto.getRandomValues(new Uint8Array(SessionIdLength))) id += Alphabet[byte % Alphabet.length];
	return id;
}

/**
 * Builds a `custom_id` readable by the framework's `StringIdParser`: `<handler>.<sessionId>.<action>`.
 */
export function encodeCustomId(handler: string, sessionId: string, action: string): string {
	if (action.length === 0 || action.includes('.')) {
		throw new TypeError(`Invalid action id "${action}": it must be non-empty and must not contain "."`);
	}

	const customId = `${handler}.${sessionId}.${action}`;
	if (customId.length > ButtonLimits.MaximumCustomIdCharacters) {
		throw new RangeError(`The custom id "${customId}" is longer than ${ButtonLimits.MaximumCustomIdCharacters} characters`);
	}

	return customId;
}

export interface DecodedCustomId {
	sessionId: string;
	action: string;
}

/**
 * Reads the `content` produced by `StringIdParser` for a custom id built by {@linkcode encodeCustomId}.
 */
export function decodeCustomIdContent(content: unknown): DecodedCustomId | null {
	if (!Array.isArray(content) || content.length !== 2) return null;
	const [sessionId, action] = content as unknown[];
	return typeof sessionId === 'string' && typeof action === 'string' ? { sessionId, action } : null;
}
