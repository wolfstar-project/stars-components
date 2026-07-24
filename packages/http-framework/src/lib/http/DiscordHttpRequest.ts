import type { Result } from '@sapphire/result';
import type { Key } from '../utils/security.js';
import type { HttpReply } from './HttpReply.js';

/**
 * Normalized HTTP request fields used by the shared Discord interactions pipeline.
 * Both the Node `listen()` path and the Fetch adapter map into this shape.
 */
export interface DiscordHttpRequest {
	method: string | undefined;
	/**
	 * Path used for matching against `postPath`.
	 * For Node this is the raw `IncomingMessage.url` (same semantics as before).
	 * For Fetch this is the URL pathname.
	 */
	url: string | undefined;
	signature: string | null | undefined;
	timestamp: string | null | undefined;
	/**
	 * Reads the raw body text, enforcing the configured size limit.
	 */
	readBody(): Promise<Result.Err<string> | Result.Ok<string>>;
}

export interface ProcessDiscordHttpOptions {
	path: string;
	key: Key;
	reply: HttpReply;
}
